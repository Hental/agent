# 豆包工作非交互 CLI

范围：会话列表、标题搜索、详情、历史消息、通过首条提示创建、继续对话、重命名、删除。没有 TUI，不实现独立的本地工具执行器。TypeScript 实现（`src/cli.ts` 入口、`src/client.ts` 协议层），经仓库根的 tsx 运行，依赖（zx、lossless-json 等）安装在仓库根。

实现原理、接口字段、鉴权逻辑及事实依据与置信度见 [doc/impl.md](doc/impl.md)。修改协议行为时同步更新该文档。

## 运行

在仓库根目录运行 `pnpm run doubao-work ...`，或直接运行 `apps/doubao-work-cli/doubao-work ...`。本机可通过 `~/.local/bin/doubao-work` 链接调用。

需要 Node.js 22.12+，在仓库根目录执行 `pnpm install` 安装依赖。wrapper 解析自身软链后调用仓库的 `node_modules/.bin/tsx`，可从任意工作目录执行；无需全局安装 tsx。

```sh
doubao-work --help
doubao-work auth status
doubao-work sessions list --limit 20
doubao-work sessions list --all --search 测试
doubao-work sessions get SESSION_ID
doubao-work sessions messages SESSION_ID --all
doubao-work sessions create -p '只回复你好，不调用工具' --title CLI测试
doubao-work sessions send SESSION_ID -p '继续上一轮'
doubao-work sessions rename SESSION_ID '新标题'
doubao-work sessions delete SESSION_ID --yes

# Kimi 风格的单次调用；全局参数放在子命令前。
doubao-work --output-format text -p '只回复你好'
doubao-work --output-format stream-json --session SESSION_ID -p '继续上一轮'
doubao-work --timeout 300 --output-format json sessions create -p '任务描述'
```

默认 stdout 为 JSON；`text` 仅对提示调用输出最终文本，会话 ID 写 stderr；`stream-json` 输出逐行 `session`、`text_delta`、`result` 事件，不输出原始 SSE 中的内部推理。失败写 stderr 并返回 1；参数错误返回 2。不存在交互式确认，删除必须显式加 `--yes`，仅接受一个 ID，无批量全删功能。

`src/args.ts` 使用 zx 的 `parseArgv` 解析参数，预先拒绝未知选项、重复选项和缺失值，所有 ID 与提示按字符串保留。以 `-` 开头的选项值使用 `--prompt=VALUE`；以 `-` 开头的位置参数放在 `--` 后。根目录已有 zx 依赖，使用 `pnpm add -Dw zx` 安装或更新；本 CLI 不再依赖 commander。

列表默认一页，`next_cursor` 用于 `--cursor`，`next_pin_query_type` 用于 `--pin-query-type`（置顶与普通会话的分组状态）；`--all` 自动处理两种游标，`--search` 对已读取页面中的标题匹配（全量搜索使用 `--all`）。默认排除归档。历史默认从头正序拉取一页，`--all` 拉取全部，`--anchor` 使用返回的 `next_index`，`--direction 1` 向前、`2` 向后。所有 ID 保留字符串，协议游标使用 BigInt 解析并经 lossless-json 序列化为 JSON 数字（不加引号），避免 64 位精度损失。

## 登录态与抓包

1. 在已登录的豆包工作中发送一条普通测试提示，保证 Bifrost 捕获到 `/chat/completion` 与 `/im/conversation/info`。
2. 执行 `doubao-work auth capture` 自动选择最近的豆包工作流量；也可显式指定 `--request-id ID --completion-id ID`。
3. 执行 `doubao-work auth status`，会真实调用列表接口验证登录。

凭据、设备参数和 completion 运行环境模板保存在 `~/.config/doubao-work-cli/profile.json`，原子写入、权限 `600`。`--profile PATH` 可选择独立配置。不要将配置、Cookie、原始抓包或个人工作目录提交到仓库。抓包中原始提示会从保存模板中移除。

本机采集使用 Bifrost 代理 `127.0.0.1:9900`、`tls.app-include=DoubaoWork*`，启动豆包工作时传 `--proxy-server=http://127.0.0.1:9900`；未修改系统代理。常规 CLI 请求直接使用 HTTPS，不依赖 Bifrost；重新捕获登录态时才需要代理。本次已移除新增 TLS 抓包规则，变更期间关闭自动断连并恢复原配置。因为客户端提示还有其他本地任务运行，已取消退出，当前进程仍携带临时代理启动参数；等其他任务完成后正常退出再启动即可清除。

`auth capture` 会保存当次提示的模型及运行环境。新会话复用这一运行环境和工作目录；继续其他会话时，若设备、工作目录或模型不匹配，会报错并要求从目标会话重新捕获。CLI 不宣称是一个独立 Kimi 编码执行器：涉及本地文件或工具的任务仍依赖豆包工作客户端在线处理其工具通道；本次实测覆盖文本会话 CRUD 和上下文续聊，没有验证任意本地工具执行。登录过期或客户端运行环境失效时，重新捕获，不自动绕过登录、不自动重试写请求。

## 协议来源与验证

2026-09-11，豆包工作 2.29.1，`aid=1044603`。依据运行中的客户端抓包及客户端自带 JavaScript。接口可能随版本变动。

| 功能 | HTTP POST 路径 | cmd / 说明 |
| --- | --- | --- |
| 列表 | `/im/chain/recent_conv` | 3200，`pull_recent_conv_chain_uplink_body` |
| 详情 | `/im/conversation/info` | 1110，`get_conv_info_uplink_body` |
| 历史 | `/im/chain/single` | 3100，协议拼写 `pull_singe_chain_uplink_body` |
| 重命名 | `/im/conversation/update_name` | 4150，`update_conversation_name_uplink_body` |
| 删除 | `/im/conversation/batch_del_user_conv` | 4171，`delete_all=false`，仅一个 ID |
| 创建/继续 | `/chat/completion` | SSE，`need_create_conversation` 控制创建 |

`/im/conversation/create` 会返回默认旧会话，不能作为创建独立工作任务的入口。删除完成后详情仍可返回，`status=2`，列表不再显示；重命名与删除均读回验证。IM HTTP 200 不等于业务成功，必须检查 `status_code`。SSE 必须等到 `SSE_REPLY_END/end_type=3`；提前断流按失败处理并保留已获得的会话 ID，不悄悄重发。

```sh
pnpm run doubao-work:test
pnpm run doubao-work:typecheck
```

单元测试使用 node:test + tsx（`src/client.test.ts` 覆盖协议层、`src/cli.test.ts` 覆盖 CLI 进程行为、`src/transport.test.ts` 覆盖超时和断流），fixture 全部合成，不读取真实凭据或线上会话。覆盖游标精度、分页停止与去重、SSE 分帧/追加/覆盖/错误、避免输出内部推理、写请求 ID 更新、配置权限、单会话删除边界及运行环境匹配。实测用专用临时会话完成创建 → 详情/历史 → 重命名 → 续聊记忆 → 删除 → 状态及列表验证。中间产物在仓库 `.reports/doubao-work-cli/`，不可作为公共测试 fixture。

## 真实接口 E2E

```sh
pnpm run doubao-work:e2e
pnpm run doubao-work:e2e --profile ~/.config/doubao-work-cli/profile.json --timeout 90
```

`src/e2e.ts` 通过子进程调用真实 `doubao-work` 可执行入口，不 mock 网络，不包含在 `doubao-work:test` 中。运行前需有可用的登录 profile 和 completion 模板；通过 pnpm 手动执行即会创建一个临时会话，发两条文本提示，最后删除该会话。脚本不自动抓包或刷新登录态，不需要新增依赖。

覆盖 auth status、SSE 创建、详情标题/状态、列表标题搜索、每页一条的历史分页、顶层 `--session -p` 上下文续聊、重命名读回、缺少 `--yes` 拒绝删除，以及删除后的 status=2 和列表 ID 消失。提示带随机标记并要求不调用工具；回复须与标记完全一致，模型不遵循提示也会导致失败。

无论中途断言失败还是收到 SIGINT/SIGTERM，脚本都会尝试清理本次创建且已取得 ID 的会话；从 SSE ACK 尽早记录 ID。写请求不自动重试，清理失败也返回非零。若创建请求未取得 ID 就断开，报告会标记结果未知，不按标题猜测或删除其他会话；SIGKILL、断电等情况下无法保证清理，应人工检查。

每次运行生成 `.reports/doubao-work-cli/e2e/<时间与随机标识>/result.json`（0600），仅保存步骤结果、耗时、测试会话 ID 和清理状态，不保存 Cookie、prompt、完整会话或原始响应。CLI 总超时使用 `--timeout`，E2E 另外为每个子进程设置 `timeout + 15` 秒上限；全分页调用也受该子进程上限约束。成功退出 0，执行失败或清理未验证退出 1。
