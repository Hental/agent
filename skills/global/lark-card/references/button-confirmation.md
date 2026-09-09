# 飞书按钮确认

用于向已核验收件人展示待执行操作的信息，并取得“确认/拒绝”决定。操作内容由调用技能提供；确认能力本身不执行叫车、支付等业务动作。

## 处理模式

项目交互卡统一通过共享插件发送，以下两种模式共用同一个按钮协议和决定校验。`botmux ask buttons` 的原生阻塞提问不是本技能的持久化/恢复入口。

默认本地读取模式的请求、发送与 agent loop 处理步骤见 [default.md](default.md)。

需要收到 action 后重新唤起原会话时，在项目根目录用以下 JavaScript 生成请求的 `actionHandling`。源码中的路径使用相对路径；当前插件要求持久化的 `cwd` 和 `socketPath` 已解析，因此在调用侧使用 `resolve`，避免后台服务按自己的工作目录解释路径。

```js
import { resolve } from 'node:path';

const actionHandling = {
  mode: 'resume',
  agent: 'codex-cli',
  threadId: '<原 Codex 会话完整 UUID>',
  cwd: resolve('.'),
};
```

`codex-cli` 使用参数数组启动 `codex exec resume --json <threadId> -`，提示通过 stdin 输入，沿用服务进程的 Codex 登录和配置，不绕过审批。调用方必须核实原 CLI 会话已空闲并且属于该工作目录，不与仍在运行的 CLI 并发写入。

`codex-app` 使用：

```js
import { resolve } from 'node:path';

const actionHandling = {
  mode: 'resume',
  agent: 'codex-app',
  threadId: '<原 App 任务完整 UUID>',
  cwd: resolve('.'),
  socketPath: resolve('<相对于项目根目录的实际控制 socket 路径>'),
};
```

该模式通过 `codex app-server proxy --sock` 连接既有运行时，依次 initialize、thread/resume、核验空闲状态和 cwd、turn/start。必须提供属于目标任务的实际控制 socket；不另起 app-server 冒充桌面 App，也不把 Codex 的内部工具当作 Hono 可调用的 HTTP 接口。部署时先确认桌面版本暴露该接口；缺少 socket 时不能选择此模式或悄悄退回 CLI。

服务启动后自动扫描持久化队列，当前执行器串行派发，CLI 本轮结束前其余请求保持排队；回调线程不等待 agent 执行业务。运行服务的机器必须在线，拥有原 Codex 会话、工作目录和登录态，CLI 可通过服务环境的 `CARD_CODEX_BIN` 指定。Botmux 凭证不会传给新 agent 进程。恢复提示只定位权威请求文件，业务内容和按钮 payload 不拼成命令。

`status` 的 `resumeDelivery.status` 与按钮决定分开：queued 为待派发，dispatching 为已认领，started 表示 App 接受新 turn（附 turnId），completed 表示 CLI 本轮正常结束，unknown 表示执行结果无法确认；这些状态都不保证业务成功。重复按钮不重新派发。服务崩溃遗留的 dispatching 和 unknown 不自动重试，先检查原任务和业务状态，避免重复操作；尚未认领的 queued 会在服务恢复后继续处理。

取消尚未派发的恢复任务：`node apps/botmux-card-confirmation/dist/confirm.js cancel-resume <requestId>`。可以在按钮点击前取消，后续回调仍保存决定但不唤起。已经派发时必须到原 agent 运行时停止任务。业务参数变化还需 invalidate 原请求。测试模式的回调也可唤起，但原会话必须把结果当作测试，不能执行业务动作。

## 自定义卡片与插件回调

### 本机通用卡片确认插件

统一使用项目中的 [botmux-card-confirmation](../../../../apps/botmux-card-confirmation/AGENTS.md)，Botmux 插件 ID 为 `card-confirmation`，动作名为 `card_confirmation_decide`。Botmux 中转卡片发送、更新及按钮回调；该插件核验请求并记录决定，具体业务流程读取结果后执行后续操作。

构建一次后在项目根目录运行 `node apps/botmux-card-confirmation/dist/confirm.js send ./.reports/<任务名>/request.json <已核验的完整会话ID>`（先在该 app 目录执行 `pnpm install && pnpm run build`）。请求提供 `title`、完整 `summary`、`expiresAt`（未来时间，带时区）、可选 `context`/`snapshotPath` 和 `options`。每个选项声明唯一 `id`、显示 `label`、结果 `result`（`confirmed`/`rejected`/`selected`）以及可选的业务 `payload`、按钮 `type` 和结果提示 `resultText`。省略 options 时为通用确认/拒绝。高德调用者需显式设置标题和“确认呼叫”按钮文案，并提供当前行程快照。

默认使用主技能中已核验的 Mini 私聊身份；其他目标通过 `target: {larkAppId, chatId, operatorId}` 提供已核验映射。客户端还会通过 Botmux history 核对完整会话与 chat_id。按返回的 `requestId` 运行 `status <requestId>` 获取结果；只有 `testOnly: false`、期望的状态和选择、`decision.source: botmux-card-action` 且符合调用业务的当前参数核验，才能继续执行。`selected` 只表示选择了某个选项；业务 payload 从已保存的选项读取，不接受回调自行增加的参数。

发交互卡前运行 `node apps/botmux-card-confirmation/dist/confirm.js health`。插件服务手动运行；服务启动和 Botmux 3.18.14 的兼容方式见插件 AGENTS.md。保留服务直到所有待确认流程结束。该共享插件使用机器默认启用，以使当前机器人加载回调路由；仅服务健康或发卡成功不能单独证明回调可用。

用户要求测试时使用 `send-test <已核验的完整会话ID>`，卡片醒目标注仅测试，记录为 `testOnly: true`；测试结果永远不能授权真实操作。明确要求端到端测试时可通过原生界面自动点击测试卡片，并注明由代理操作。

参数变化时先 `invalidate <旧requestId>` 再发送新请求。`status` 会通过 Botmux 更新终态卡片并移除按钮；`cardPatchError` 表示显示更新失败，可用 `patch <requestId>` 重试。不得直接改写回调记录或复用历史业务批准。

### 其他自定义卡片

使用 schema 2.0 的 `body.elements` 保存完整卡片 JSON，显示业务信息和对应操作按钮。按钮回调值必须遵循实际插件声明；插件需要把当前请求 ID、快照/参数版本、消息、会话、预期点击者及有效期关联起来，并提供可读取的结果。若插件不能核验这些关联，不用于叫车等需绑定当前参数的确认。

```text
botmux send --session-id <已核验会话> --no-mention --card-file ./.reports/<任务名>/card.json --plugin-card-action <已启用的插件ID>
```

记录 `success`、`messageId` 和 `sessionId`，按插件文档读取该消息的真实回调结果。只接受当前消息、当前请求、预期点击者在有效期内的首次决定；拒绝、过期和参数变更使原请求失效。重复或迟到回调不得再次触发业务动作。

决定完成或失效后，生成无操作按钮的状态卡片，再用 `botmux card patch --session-id <已核验会话> --message-id <原messageId> --card-file ./.reports/<任务名>/card-updated.json` 原地更新。不要把调用代理自己写入的本地“确认”记录当作用户回调证据。
