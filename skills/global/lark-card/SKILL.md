---
name: lark-card
description: 通过 Botmux 发送和更新飞书/Lark card，并处理 button action。默认保存按钮结果供 agent loop 读取；也支持显式声明 codex-cli 或 codex-app，在收到按钮结果后恢复指定会话。用户要求发送卡片、按钮确认或选择、回调后继续任务时使用。
---

# Lark Card：发送卡片与处理按钮

Botmux 是项目所有飞书/Lark 卡片消息和按钮交互的统一 gateway：卡片发送、更新与回调均经 Botmux 中转，业务只提供内容、选项和后续处理。普通展示卡片直接使用 Botmux；通用按钮确认/选择使用 [botmux-card-confirmation](../../../apps/botmux-card-confirmation/AGENTS.md)。不要新增绕过 Botmux 的直连飞书发送或回调服务。

使用 PATH 中的本机 `botmux` CLI；找不到命令时先检查安装和 PATH 配置。此技能的发送入口是 Botmux，不再使用旧服务的 `pnpm cli`、`LARK_BOT_URL` 或 `--base-url`。

文档链接相对于所在 Markdown 文件解析。以下命令统一在项目根目录执行，文件参数使用相对于项目根目录的路径；通过全局 Skill 符号链接读取时，先定位其真实源目录，再从该目录的 `../../..` 定位项目根目录。

## Button action 的两种处理方式

交互卡片统一使用共享 `card-confirmation` 插件，发送时通过请求的 `actionHandling` 选择处理方式：

1. **本地读取（默认）**：省略字段或传入 `{"mode":"local"}`。Hono 核验回调后把 `decision` 保存到本地，当前 agent loop 使用 `status <requestId>` 读取并继续。结束当前轮次不会自动恢复会话。使用此模式时阅读 [默认流程](references/default.md)。
2. **恢复会话**：传入 `{"mode":"resume","agent":"codex-cli|codex-app",...}`。调用时必须明确 agent 类型、原会话完整 UUID 和工作目录（由相对路径在调用时解析）；`codex-app` 还必须提供目标运行时的控制 socket。Hono 先保存结果并入队，后台执行器恢复会话。不得猜测 agent 类型、使用最近会话或把 Botmux 会话 ID 当作 Codex thread ID。

两种方式都保存 action 结果。拒绝按钮也会触发 resume，使原会话处理取消；恢复会话并不代表批准业务操作。只有在原会话准备等待按钮、没有其他运行中的轮次时使用 resume。发送后不再由当前 loop 同时消费该决定。参数、示例、取消方式和运行限制见 [按钮确认](references/button-confirmation.md)。

## 默认收件人

默认收件人固定为 `liutao.fe@bytedance.com`，默认发送到该账号与 Botmux 机器人的私聊。用户说“发给我”“通知我”或调用本技能发送结果而未另指定目标时，直接使用此收件人，无需再次询问邮箱。用户显式指定其他收件人或群聊时，以该次要求为准。

邮箱中的 `\@` 按普通 `@` 处理。邮箱用于识别收件人，不是 `botmux send` 支持的直接收件参数；实际发送前需匹配该账号的 Botmux 私聊会话。

### 已核实的私聊目标（2026-09-07）

用户确认并提供了含邮箱的 Mini 私聊截图；随后通过该 Bot 的接口核对了实时机器人名称、私聊消息和发送者，目标对应如下：

- 机器人：`Mini`（原名 `Botmux Codex`），AppID `cli_aa149e4ed9389cb5`。
- 该应用签发的收件人 open_id：`ou_0de0382daf0b601518c6eb63486207d3`。
- 飞书私聊 chat_id：`oc_558e971f498438280d88ec1372df95c2`。

查找 Botmux 会话时优先用上述 AppID 和 chat_id 精确匹配，无需反复询问收件人。这是用户确认结合消息记录建立的映射，并非通讯录 API 成功返回的邮箱映射；open_id 只限该应用使用，换绑应用后必须重新核验。

此私聊的用户与机器人属于不同租户。通讯录按邮箱解析无结果、用户详情返回 `41050`，不等于私聊不存在或消息不可达。诊断时区分“飞书私聊已存在”和“Botmux 已为私聊创建本地会话”：若消息已接收但本地没有会话，检查 `allowedUsers` 是否包含本应用观察到的已确认收件人 open_id，再检查配置是否已加载。

## 确定发送会话

```bash
botmux status
botmux list --plain
botmux setup list --json
```

- 默认查找 `liutao.fe@bytedance.com` 与目标机器人的私聊会话。通过目标应用可见的邮箱与用户 ID 映射、会话收件人信息核验身份；`allowedUsers` 中写有该邮箱不代表邮箱已解析成功，也不证明某个会话属于该账号。不能仅按姓名“刘韬”匹配其他企业中的同名账号。
- 使用 `--session-id <完整会话ID>` 明确选择已核验的私聊会话。即使当前在 Botmux 托管的群聊 CLI 会话中，也不能把当前群当作“发给我”的默认目标；只有当前会话已确认是目标账号的私聊时，才可省略 `--session-id`。
- 默认收件人已确定，但不能把列表中任意一个会话当作该收件人的私聊，也不能自动改发群聊。
- `--chat-id <oc_xxx>` 只覆盖目标群，不替代来源会话。发送机器人由来源会话决定；不能用 `--bot`、`--email` 或 `--receive-id` 替代 `botmux send` 的会话参数。
- 没有合适私聊会话时，请用户用 `liutao.fe@bytedance.com` 对应的飞书账号给机器人发一条消息建立会话；如果目标应用无法解析该邮箱，先说明企业或应用可见范围问题，不能承诺建立任意会话即可解决。不要伪造会话文件或注入 App Secret 绕过会话要求。

## 发送文本、图片和文件

以下示例中的 `<session-id>` 默认均为已核验的 `liutao.fe@bytedance.com` 私聊会话 ID；文件路径也需替换为实际路径。

```bash
# 给 liutao.fe@bytedance.com 发私聊消息；普通正文由 Botmux 包装为卡片
botmux send --session-id <session-id> --no-mention '任务已完成'

# 长消息从 UTF-8 文件读取
botmux send --session-id <session-id> --no-mention --content-file ./.reports/lark-card/message.md

# 图片、文件参数可重复
botmux send --session-id <session-id> --no-mention '结果见附件' --images ./.reports/lark-card/preview.png --files ./.reports/lark-card/report.pdf
```

默认私聊通知使用 `--no-mention`。每条发送都要明确选择 `--no-mention`、`--mention-back` 或 `--mention <open_id:名字>`；后两种仅在用户另指定群聊等需要 @ 的场景使用。`--mention` 表示 @，不表示私信收件人。

用户另指定群聊时，可在已核验的来源会话命令上加 `--chat-id <oc_xxx> --top-level --no-quote`；发送到明确指定的已有话题可用 `--into <话题根消息ID>`，不要与 `--top-level` 同用。最终结果可加 `--response-kind final`，进度可用 `--response-kind progress`。

## 自定义卡片

将完整飞书 interactive 卡片 JSON 保存为文件，再通过 Botmux 发送。优先使用 schema 2.0 的 `body.elements` 结构。

```bash
botmux send --session-id <session-id> --no-mention --card-file ./.reports/lark-card/card.json

# 用发送成功结果中的 messageId 原地更新卡片
botmux card patch --session-id <session-id> --message-id <om_xxx> --card-file ./.reports/lark-card/card-updated.json
```

`--card-file` 与 `--card-json` 二选一，自定义卡片不能与 `--content-file` 或 `--voice` 混用。预约结果、课程列表、支付链接等内容应组装为卡片 JSON；旧服务的 `send-booking-card`、`send-course-list-card`、`card-actions` 和事件重试命令没有直接对应的 Botmux 替代命令。

纯展示或跳转链接的卡片可直接发送。需要“确认/拒绝”等按钮并读取用户决定时，先阅读 [按钮确认](references/button-confirmation.md)：确认/选择卡片统一使用 `card-confirmation` 插件及上述两种处理模式；更多交互类型按 Botmux 插件声明接入，并使用 `--plugin-card-action <plugin-id>`。仅发送卡片不等于具备预约、支付或按钮处理能力，不要沿用旧 HTTP 服务的回调协议。

## 授权与结果核验

本技能已约定默认收件人，用户要求发送或通知时无需重新确认邮箱；内容按本次任务和已有授权确定，不要求用户逐字提供正文。仅修改技能或准备草稿不代表允许额外发送测试消息，也不代表持续或定期通知授权。

检查命令退出状态和实际输出的 `success`、`messageId`、`sessionId`；只有确认成功后才报告已发送。出现超时或结果不明时，先核对目标会话历史，避免盲目重发造成重复通知：

```bash
botmux history --session-id <session-id> --limit 10
botmux logs --lines 80 --no-follow
```

中间消息文件、卡片 JSON 和日志放在项目根目录 `.reports/` 的任务子目录中。使用文件参数传递复杂正文，避免 shell 将反引号或 `$()` 当作命令执行。不要将 App Secret、Dashboard 管理 token 写入技能或普通通知。

参数依据 Botmux 3.18.14 核对。需要核对更新后的用法时先看 `botmux --help`；该版本的 `botmux send --help` 仍进入会话解析，不是独立帮助入口。
