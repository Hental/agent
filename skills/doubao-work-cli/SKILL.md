---
name: doubao-work-cli
description: 使用本机豆包工作非交互 CLI 管理会话：创建、续聊、列表与标题搜索、历史、重命名、删除，以及抓取登录态、通过 profile 选择模型/工作目录/设备、运行真实接口 E2E。适用于豆包工作会话操作；不用于飞书云文档或独立本地编码执行器。
---

# 豆包工作 CLI

使用仓库现有 TypeScript CLI，不重新实现 HTTP 请求。入口为 `apps/doubao-work-cli/doubao-work`，使用仓库内 tsx；参数解析依赖 zx。若要了解协议或修改实现，读取 [实现依据与置信度](../../apps/doubao-work-cli/doc/impl.md)；完整命令说明见 [应用说明](../../apps/doubao-work-cli/AGENTS.md)。

## 定位与运行

先解析本 SKILL.md 的真实路径（全局入口可能是符号链接）；Skill 源目录上两级是仓库根。优先调用该仓库的 `apps/doubao-work-cli/doubao-work` 绝对路径，避免命中其他版本。下文 `doubao-work` 均代表该入口。本机已有同名命令时，核对其链接指向后也可使用。

依赖缺失时在仓库根执行 `pnpm install`。使用 `doubao-work --help` 查看命令。无需全局 tsx；CLI 可从任意当前目录调用，shell 当前目录不决定豆包任务工作目录。

全局参数必须放在命令之前：`--profile PATH`、`--timeout SECONDS`、`--output-format json|text|stream-json`。默认 profile 为 `~/.config/doubao-work-cli/profile.json`，默认超时 180 秒。

## 会话操作

```sh
doubao-work auth status
doubao-work sessions list --limit 20
doubao-work sessions list --all --search '标题关键词'
doubao-work sessions get SESSION_ID
doubao-work sessions messages SESSION_ID --all
doubao-work sessions create -p '提示内容' --title '会话标题'
doubao-work sessions send SESSION_ID -p '继续任务'
doubao-work sessions rename SESSION_ID '新标题'
doubao-work sessions delete SESSION_ID --yes

# 单次提示形式；--session 只搭配顶层 -p。
doubao-work --output-format text -p '提示内容'
doubao-work --output-format stream-json --session SESSION_ID -p '继续任务'
```

- ID 保留十进制字符串，不经 JavaScript Number 转换。JSON 中数值游标也可能超过安全整数范围，处理原始 JSON 时使用项目的 lossless-json。
- 标题搜索只过滤已获取页面；全量标题搜索加 `--all`。列表默认排除归档，不能据此认定归档会话不存在。
- 手动分页同时保存 `next_cursor` 和 `next_pin_query_type`，分别传 `--cursor` 与 `--pin-query-type`；历史使用 `next_index` 对应 `--anchor`。均以 `has_more` 判定继续，通常直接用 `--all`。
- 删除只接受一个 ID，明确删除请求已有授权时直接传 `--yes`，无需再次交互确认；不要将“整理/查找”自行扩展为删除。重命名和删除由 CLI 读回验证。
- `create --title` 先创建再重命名，不是事务。若改名失败，利用错误中的 session ID 检查已有会话，不重复创建。
- 未知/重复选项、缺值返回参数错误。以 `-` 开头的提示使用 `--prompt=VALUE`；以 `-` 开头的位置参数放在 `--` 后。用结构化进程参数或正确 shell 引号传提示，避免命令替换。

## 模型、工作目录和设备

当前没有 `--model`、`--cwd`、`--device`。新会话复用 profile 中的 completion 模板；不要凭空编造模型键或设备 ID，也不要宣称改变 shell 目录能切换工作目录。

需要不同环境时，在豆包工作客户端选好模型、目录和设备，发送普通文本提示并捕获对应请求，然后保存独立 profile：

```sh
doubao-work --profile ~/.config/doubao-work-cli/project-a.json auth capture
doubao-work --profile ~/.config/doubao-work-cli/project-a.json auth status
doubao-work --profile ~/.config/doubao-work-cli/project-a.json -p '任务描述'
```

配置字段位于 `completion_template.option`：

| 选项 | 字段 |
| --- | --- |
| 模型、推理强度 | `conversation_init_ext.model_item_key`、`reasoning_effort` |
| 目录 | `general_task_param.agent_task_param.workspace` |
| 设备、运行类型 | `general_task_param.agent_task_param.local_device_id`、`runtime_type` |

续聊会核对服务端提供的模型/运行环境字段；不匹配时从目标会话重新捕获，而非跳过校验。直接手改这些字段能否切换服务端环境未经验证。本 CLI 没有独立本地工具执行器；文件或工具任务依赖豆包工作客户端及其工具通道，已验证范围是文本会话操作。

## 登录态与故障处理

`auth status` 真实调用列表接口，只证明当前列表鉴权可用，不证明 completion 模板或工具通道有效。登录失效时重新捕获；不实现自动刷新。

`auth capture` 依赖 Bifrost 已保存的豆包工作请求：默认选取 `/im/conversation/info` 和 `/chat/completion`，也可用 `--request-id ID --completion-id ID` 明确选择同次登录的请求。若需要配置代理或采集流量，使用当前环境的 bifrost Skill；应用说明中的旧实验代理状态不是当前机器状态，先检查再调整。普通 CLI HTTPS 调用不依赖 Bifrost。

Profile 含 Cookie、设备和工作目录等敏感信息，以 0600 明文保存。不要输出文件全文、复制进 Skill、提交凭据或原始抓包。配置选择优先沿用用户指定值；缺少客户端登录态时说明需要在客户端登录并产生抓包，不伪造凭据。

默认 stdout 为 JSON；text 模式输出正文，session ID 在 stderr；stream-json 输出逐行 session/text_delta/result。最终 result.text 才是聚合后的权威正文，覆盖 patch 不一定产生 text_delta。失败退出 1，参数错误退出 2。

HTTP 200 或收到 SSE ACK 不代表生成完成。CLI 必须收到结束事件才返回 finished=true；超时、断流、错误可能发生在服务器已经创建会话之后。利用错误里的 session ID 查询状态，不自动重发写请求；没有 ID 时明确报告结果未知，不猜测会话归属。

## 验证

在仓库根执行：

```sh
pnpm run doubao-work:test
pnpm run doubao-work:typecheck
# 仅在用户要求真实流程验证时执行；会创建会话、发两条提示并删除。
pnpm run doubao-work:e2e --timeout 90
```

E2E 不包含在单元测试中，使用真实登录态。脚本只清理本次取得 ID 的会话，失败也尝试清理；报告保存在 `.reports/doubao-work-cli/e2e/<run-id>/result.json`。确认 `ok=true`、各步骤通过及 `cleanup=verified-deleted` 后再报告成功。生成内容可能未严格返回随机标记，不能为通过测试而放宽断言；清理失败或创建结果未知需如实报告会话 ID/状态。单次通过不等于之前失败的根因已确定。
