# 飞书按钮确认

用于向已核验收件人展示待执行操作的信息，并取得“确认/拒绝”决定。操作内容由调用技能提供；确认能力本身不执行叫车、支付等业务动作。

## 选择发送入口

Botmux 3.18.14 有两种入口，不能混用其参数和回调协议：

- **Botmux 原生会话内的内置提问**：`botmux ask buttons` 自带按钮处理和结果返回，不需要插件。只在当前进程本来就由 Botmux daemon 启动，且当前应用和私聊已核验属于目标收件人时使用。该命令依赖 Botmux 注入的会话环境，不支持 `--session-id`/`--chat-id` 切换收件人；不能在普通 Codex/终端会话中手动伪造这些环境来冒充原生会话。
- **普通 Codex/终端会话的自定义卡片**：按主技能选定完整 `--session-id`，通过已安装、已启用并实现该动作的 Botmux 插件发送和接收按钮回调。先运行 `botmux plugin list`，阅读对应插件声明，核验动作名称、按钮 value 格式、点击者身份、消息关联和结果查询方式。没有合适插件时，明确报告回调能力尚未接入，停止依赖确认的业务操作；不能猜测一个插件 ID 或发送无法处理的按钮。

用户只要求修改技能时，完成规则修改并说明发现的运行限制；不要为验证按钮额外发测试消息、冒充用户点击，或把本次修改视为某次业务操作的批准。

## 内置提问

确认当前 `BOTMUX_LARK_APP_ID`、`BOTMUX_CHAT_ID` 和原生会话对应主技能中核实的应用及私聊。给默认收件人发送时，预期点击者为该应用对应的 `ou_0de0382daf0b601518c6eb63486207d3`；换绑应用后重新核验。

```text
botmux ask buttons --json --timeout <有效秒数> --options "confirm=确认呼叫,reject=拒绝" <完整确认正文>
```

正文必须包含操作信息、确认编号及有效期；不能只写“是否确认”。复杂正文从 `.reports/` 下的 UTF-8 文件读取，使用 `execFile`/`spawn` 的参数数组传给 CLI，避免把正文拼进 shell 命令。`ask` 不支持 `--content-file`、`--card-file`、`--images` 或 `--no-mention`；需要截图时先通过 `send --session-id <已核验会话> --no-mention --images <截图>` 发送，并在正文中关联同一确认编号。

保留正在等待的同一次命令，分段读取输出以便继续响应用户；不要为了轮询而反复执行 `ask` 发新卡。等待期间不得执行依赖批准的操作。

`--json` 成功返回形如：

```json
{"selected":"confirm","answers":[["confirm"]],"by":"ou_xxx","timedOut":false,"comment":null}
```

- 只有退出码为 `0`、`timedOut` 为 `false`、`selected` 为 `confirm` 且 `by` 为预期收件人，并满足调用技能的当前编号、有效期和参数核验时，才能按确认继续。
- `selected` 为 `reject` 时停止本次待执行操作；退出码 `0` 本身不代表确认。
- 超时返回退出码 `124`；环境/参数错误为 `2`；daemon 不可达或提问失效为 `3`。任何异常、未知选择、身份不符或无法对应本次提问的结果均不能批准。
- 仅文字回复时 `selected` 可能为空，文字位于 `comment`；不能把它当作按钮点击。若同时有备注，先核对其中是否修改参数或要求停止，再按调用技能处理。
- 命令 stdout 不会自动成为一条飞书回复。使用 `send --session-id <已核验会话> --no-mention` 回执处理结果；确认回执应描述待执行状态，不得在业务操作成功前宣称完成。

## 自定义卡片与插件回调

### 本机通用卡片确认插件

统一使用项目中的 [botmux-card-confirmation](../../../../apps/botmux-card-confirmation/AGENTS.md)，Botmux 插件 ID 为 `card-confirmation`，动作名为 `card_confirmation_decide`。Botmux 中转卡片发送、更新及按钮回调；该插件核验请求并记录决定，具体业务流程读取结果后执行后续操作。

构建一次后在项目根目录运行 `node apps/botmux-card-confirmation/dist/confirm.js send <请求JSON绝对路径> <已核验的完整会话ID>`（先在该 app 目录执行 `pnpm install && pnpm run build`）。请求提供 `title`、完整 `summary`、`expiresAt`（未来时间，带时区）、可选 `context`/`snapshotPath` 和 `options`。每个选项声明唯一 `id`、显示 `label`、结果 `result`（`confirmed`/`rejected`/`selected`）以及可选的业务 `payload`、按钮 `type` 和结果提示 `resultText`。省略 options 时为通用确认/拒绝。高德调用者需显式设置标题和“确认呼叫”按钮文案，并提供当前行程快照。

默认使用主技能中已核验的 Mini 私聊身份；其他目标通过 `target: {larkAppId, chatId, operatorId}` 提供已核验映射。客户端还会通过 Botmux history 核对完整会话与 chat_id。按返回的 `requestId` 运行 `status <requestId>` 获取结果；只有 `testOnly: false`、期望的状态和选择、`decision.source: botmux-card-action` 且符合调用业务的当前参数核验，才能继续执行。`selected` 只表示选择了某个选项；业务 payload 从已保存的选项读取，不接受回调自行增加的参数。

发交互卡前运行 `node apps/botmux-card-confirmation/dist/confirm.js health`。插件服务手动运行；服务启动和 Botmux 3.18.14 的兼容方式见插件 AGENTS.md。保留服务直到所有待确认流程结束。该共享插件使用机器默认启用，以使当前机器人加载回调路由；仅服务健康或发卡成功不能单独证明回调可用。

用户要求测试时使用 `send-test <已核验的完整会话ID>`，卡片醒目标注仅测试，记录为 `testOnly: true`；测试结果永远不能授权真实操作。明确要求端到端测试时可通过原生界面自动点击测试卡片，并注明由代理操作。

参数变化时先 `invalidate <旧requestId>` 再发送新请求。`status` 会通过 Botmux 更新终态卡片并移除按钮；`cardPatchError` 表示显示更新失败，可用 `patch <requestId>` 重试。不得直接改写回调记录或复用历史业务批准。

### 其他自定义卡片

使用 schema 2.0 的 `body.elements` 保存完整卡片 JSON，显示业务信息和对应操作按钮。按钮回调值必须遵循实际插件声明；插件需要把当前请求 ID、快照/参数版本、消息、会话、预期点击者及有效期关联起来，并提供可读取的结果。若插件不能核验这些关联，不用于叫车等需绑定当前参数的确认。

```text
botmux send --session-id <已核验会话> --no-mention --card-file <绝对路径> --plugin-card-action <已启用的插件ID>
```

记录 `success`、`messageId` 和 `sessionId`，按插件文档读取该消息的真实回调结果。只接受当前消息、当前请求、预期点击者在有效期内的首次决定；拒绝、过期和参数变更使原请求失效。重复或迟到回调不得再次触发业务动作。

决定完成或失效后，生成无操作按钮的状态卡片，再用 `botmux card patch --session-id <已核验会话> --message-id <原messageId> --card-file <状态卡片绝对路径>` 原地更新。不要把调用代理自己写入的本地“确认”记录当作用户回调证据。
