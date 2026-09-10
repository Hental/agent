# Botmux 卡片确认

`botmux-card-confirmation` 是项目工作流共用的卡片与按钮交互适配器。Botmux 包名为 `botmux-plugin-card-confirmation`，插件 ID 为 `card-confirmation`，回调动作为 `card_confirmation_decide`。

所有飞书/Lark 卡片发送、卡片更新和按钮事件都通过 Botmux 网关中转。本应用负责请求校验和决定状态；业务工作流负责卡片内容、允许的选项及后续业务操作。HTTP 回调只校验并保存决定和恢复队列；后台恢复执行器可以启动声明的 Codex 会话，不直接调用 ADB、提交订单或付款。发送前使用 `lark-card` 核验当前收件人及完整的 Botmux 会话 ID。

## 目录结构与命令

- `src/` 下的 TypeScript 源码通过 Rspack（`rspack.config.ts`）打包为 `dist/` 下的 Node ESM 入口：`client.js`（共享 API）、`confirm.js`（CLI）、`run-local.js`（兼容运行器）、`finish-test.js`、`service/index.js`、`service/server.js`。类型声明从 TypeScript 源码生成到 `dist/*.d.ts`，不维护手写声明文件或另一套 JavaScript 实现。
- `src/types.ts`：集中定义请求、状态、选项、客户端及回调边界类型；外部 JSON（回调事件、CLI 输入）由 `src/state.ts` 和 `src/request.ts` 在运行时校验。
- `src/client.ts`：共享 API；所有发送和更新操作都通过参数数组调用 Botmux CLI，不使用飞书 SDK、应用密钥或直接 OpenAPI 调用。
- `src/cli.ts`（打包为 `confirm.js`）：共享 API 的 CLI 封装，每条成功执行的命令输出一个 JSON 结果。
- `src/request.ts`：校验通用标题、摘要、有效期、目标、选项和业务上下文。
- `src/resume.ts`：持久化恢复任务的后台派发，支持 Codex CLI 和 App Server proxy；不会执行回调提供的任意命令。`cancel-resume` 取消未派发任务。`dispatching`/`unknown` 不自动重试，避免重复启动；App 的 `started` 只代表新 turn 被接受。
- `src/state.ts`：核验回调与请求的绑定关系，并持久化首个有效决定。
- `src/lock.ts`：串行化 CLI 与回调服务进程对请求的修改。
- `src/card.ts`：渲染 schema 2.0 卡片，包括多选项卡片及不含按钮的终态卡片。
- `src/service/`：基于 Hono 和 `@hono/node-server` 的 HTTP 回调服务，仅监听本机回环地址。`GET /health` 提供健康检查，`POST /card-action` 先核验 Botmux 网关令牌，再通过 `hono/body-limit` 将请求体限制为 64 KiB。鉴权失败返回 401，超限返回 413，回调校验失败仍返回 Botmux 的警告确认响应。Hono 及 Node 适配器由 Rspack 一并打包，运行时无需额外安装依赖。
- `src/runtime.ts`：定位构建时生成的 `dist/runtime.json`（状态目录绝对路径及 Node 可执行文件路径）；打包产物相对于 `dist/` 解析该文件，不得误定位到 `apps/.reports` 或 `dist/.reports`。
- 运行状态及生成的卡片产物存放在项目根目录的 `.reports/botmux-card-confirmation/`。测试使用 `.reports/botmux-card-confirmation-test/`；冒烟测试的产物副本存放在 `.reports/botmux-card-confirmation-ts/`。

在本目录执行：

```bash
pnpm install
pnpm run build        # Rspack 打包并生成 .d.ts
pnpm run typecheck    # 对源码、测试和配置执行严格的 tsc --noEmit 检查
pnpm run test         # 针对 TypeScript 源码运行单元测试和多进程测试
pnpm run test:dist    # 针对 .reports 中的 dist 产物副本运行冒烟测试
node dist/confirm.js health
node dist/confirm.js send /absolute/request.json <verified-full-session-id>
node dist/confirm.js send-card /absolute/display-card.json <verified-full-session-id>
node dist/confirm.js status <request-id>
node dist/confirm.js invalidate <request-id>
node dist/confirm.js patch <request-id>
```

`send-card` 接收展示卡片或链接卡片。包含回调的卡片使用 `send`，由它注册每个选项并绑定请求。已有的原始卡片集成仍通过 Botmux 的 `send --card-file` / `card patch` 传输；新增交互组件必须先声明并实现对应的 Botmux 处理器。

## 确认请求

必填字段为 `summary`（Markdown）和 `expiresAt`（带时区、晚于当前时间的 ISO 时间）。可选字段如下：

- `title`：默认为 `操作确认`；调用方应提供对应的业务标题。
- `options`：1–20 个互不重复的选项。每个选项包含 `id`、`label`、`result`（`confirmed`、`rejected` 或 `selected`），以及可选的 `type`（`default`、`primary`、`danger`）、`payload`、`resultText`。默认选项为确认/拒绝。`resultText` 描述已记录的选择，不得声称尚未执行的操作已经完成。
- `selection`：可选 `{placeholder, submitLabel}`，启用原生 `form` + `select_static` + 提交按钮。非 rejected 选项进入必填下拉框，不预选；rejected 选项在表单外保留为取消按钮。选择本身不回调，提交通过现有 `card_confirmation_decide` 处理器核验 `action.formValue.choice`。Botmux 将飞书原始 `action.form_value` 规范化为 `action.formValue`，插件不得读取原始字段名。只能引用已注册选项，业务 payload 始终从本地快照读取。`__submit` 为保留 ID。未提供 `selection` 时保留原按钮布局。协议见[飞书表单容器](https://open.feishu.cn/document/feishu-cards/card-json-v2-components/containers/form-container)。
- `actionHandling`：默认 `{mode:"local"}`，保存决定供 agent loop 读取；`{mode:"resume",agent:"codex-cli"|"codex-app",threadId,cwd,socketPath?}` 在收到有效按钮 action 后恢复指定会话。agent 类型、完整线程 UUID、现有绝对 cwd 必填，codex-app 还要求所属运行时的现有控制 socket。具体调用、状态和限制见 [lark-card 按钮处理](../../skills/global/lark-card/references/button-confirmation.md)。
- `context`：与请求关联的本地业务元数据或快照版本，不包含在按钮回调值中。
- `snapshotPath`：可选的快照关联。实际图片需通过 Botmux 单独发送到同一个已核验会话，并注明请求 ID。
- `target`：已核验的 `larkAppId`、`chatId`、`operatorId`。省略时使用 `src/defaults.ts` 中已核验的 Mini 私聊映射。客户端还会通过 Botmux history 检查所提供会话当前对应的聊天。使用其他目标前，必须核验应用与操作人的映射。
- `testOnly`：默认为 false。为 true 时必须明显标注为测试，且绝不能授权真实业务操作。

预约工作流的选项示例：

```json
[
  {"id":"course_1","label":"选择课程 A","result":"selected","payload":{"scheduleId":"schedule_A"}},
  {"id":"reject","label":"取消预订","result":"rejected","type":"danger"}
]
```

按钮只携带 `action`、`requestId`、`nonce` 和 `optionId`。回调从已存储的允许选项中解析结果和业务数据，忽略回调自行提供的业务 payload。服务核验网关令牌、应用、操作人、聊天、消息、nonce、有效期及待确认状态，只接受首个有效选择。`decision` 记录选项 ID、标签、已存储的 payload、操作人、事件 ID、消息 ID 和 `source: botmux-card-action`。

业务调用方在执行操作前，必须读取 `status`，拒绝 `testOnly` 请求，核对预期决定及其来源，并重新检查当前业务参数。`selected` 仅表示选择了某个选项，不代表对所有后续操作的授权。业务内容发生变化时，必须使待确认请求失效并重新发卡。终态决定不可变，调用 `invalidate` 或收到重复回调也不得修改。发送结果不明的请求保持 `send_unknown`，重试前先检查 Botmux history。`status` 会通过 Botmux 协调更新一次终态卡片；`cardPatchError` 表示展示更新失败，可用 `patch` 重试更新，无需重新发送卡片。

所有请求修改都必须获取该请求的同一个 `request.lock` 目录锁，重新读取当前记录，并在 `finally` 中释放锁。禁止在此事务之外对已有记录调用 `saveRequest`。Botmux 调用必须在释放锁后执行。如果请求在发送期间失效，发送结束后仍须保留终态；已核验的消息 ID 仍会记录，以便下一次 `status` 更新终态卡片。回调有效期在取得锁后检查。

获取锁默认最多等待 1.5 秒，超时后拒绝操作，不接受决定。不得仅根据锁的存在时长抢占锁。如果进程崩溃后留下 `.reports/botmux-card-confirmation/<request-id>/request.lock`，先检查其中的 `owner.json`，确认原进程已经退出，再手动删除该请求的锁目录。不得删除仍由活跃进程持有的锁，也不得删除请求记录。锁所有者元数据缺失或不可读时，同样需要人工排查。

## 安装与运行

```bash
pnpm --dir /Users/liutao/workspace/agent/apps/botmux-card-confirmation install
pnpm --dir /Users/liutao/workspace/agent/apps/botmux-card-confirmation run build
botmux plugin install /Users/liutao/workspace/agent/apps/botmux-card-confirmation --link
botmux plugin enable card-confirmation
botmux plugin service start card-confirmation
```

安装或重新安装插件前，先构建 `dist/`。安装单元是整个 `dist/` 目录，运行中的服务不读取 TypeScript 源码或 `node_modules`。

通过机器默认配置启用后，本插件作为共享卡片适配器使用。也支持通过 `--bot <verified-app-id>` 为单个机器人启用。服务需手动启动，仅监听 `127.0.0.1:19361`。只要还有交互卡片等待选择，就必须保持服务运行。展示卡片或链接卡片只要求 Botmux 在线。修改运行时代码后，应重新构建并重启本服务，不要重启无关机器人。

Botmux 3.18.14 内置二进制启动插件服务时，可能出现 `pm2_jlist_json_not_found`。正常执行 `plugin service start` 生成描述文件后，可使用 `node dist/run-local.js`。该前台兼容运行器使用 Botmux 生成的网关令牌，通过健康检查核对实际子进程 PID，确认后才发布路由元数据。所有待处理工作流结束后，用 SIGTERM 停止运行器；它会清理自身的元数据。不得自行生成令牌或伪造在线记录。

Botmux 3.18.14 可能保留守护进程启动时的单机器人插件配置，因此为某个机器人启用插件后，可能已能发卡，但回调尚未路由到插件。机器默认插件配置会动态加载。必须确认启用范围覆盖目标机器人；仅服务健康不能证明网关路由有效。本项目的共享适配器采用机器默认启用。不要只为刷新插件配置而重启正在处理任务的机器人。

Schema 2.0 按钮通过 `behaviors: [{type: "callback", value: ...}]` 执行回调。Botmux 3.18.14 还会校验按钮顶层的 `value`，两处内容必须一致。在该版本中，即使传入 `--plugin-card-action`，`card patch` 也无法保留回调按钮，因此只能更新终态卡片。待确认内容发生变化时，应使原请求失效，再发送新请求。

## 测试与迁移

仅在用户要求真实测试时，执行 `node dist/confirm.js send-test <verified-session-id>` 发送带明确测试标识的卡片。在已授权的端到端测试中，可使用原生 UI 自动化点击测试卡片按钮，但必须记录该点击由助手执行。自动化测试产生的真实事件不代表用户对业务操作的批准。普通单元测试注入 Botmux 执行器并使用隔离的本地测试数据，不发送消息或创建订单。

`test/race.test.ts` 使用独立 Node 进程和文件系统同步屏障，验证决定竞争、读出旧副本后的失效操作、锁竞争超时、等待锁期间过期、异常清理，以及网关发送期间请求失效等场景。子进程使用注入的网关响应，不连接 Botmux。

专门测试兼容运行器时，`node dist/finish-test.js <request-id>` 最多等待 15 分钟，协调更新终态卡片并写入 `test-result.json`；仅当没有其他未结束请求需要该服务时，才停止同一个服务。不得将该辅助程序用于生产请求，也不得把本地测试记录视为业务批准。

本应用替代 `apps/botmux-ride-confirmation` 及 `ride-confirmation` 插件/动作。旧测试证据保留在 `.reports/amap-card-confirmation/`，不迁入当前请求，也不得复用为批准依据。确认没有进行中的请求依赖旧插件后，再禁用并卸载旧插件。2026-09-08 的飞书端到端测试结果属于旧版本；重命名后的实现需要单独验证，本地模拟测试必须明确标注。
