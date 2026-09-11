# 豆包工作 CLI 实现原理与协议依据

核对日期：2026-09-11。实验客户端版本：豆包工作 2.29.1，应用参数 `aid=1044603`。本文描述当前 TypeScript 实现与本机实验结果，不是豆包官方协议文档，也不保证其他版本或账号的行为一致。

## 1. 证据与置信度口径

本文使用以下标记；置信度是证据强弱的定性判断，不是统计概率。

| 标记 | 含义 | 能支持的结论 |
| --- | --- | --- |
| C：源码 | 当前仓库的函数、参数与分支 | 高：实现确实如此；不能单独证明服务端如此 |
| T：合成测试 | mock 请求、合成 SSE、CLI 子进程回归 | 高：覆盖输入下的客户端行为；不能证明线上兼容性 |
| L：线上实验 | 本机客户端抓包、CLI 真实请求及读回 | 高：本次版本和登录态下已观察到；跨版本推广最多为中 |
| I：推断 | 根据字段名、调用顺序或有限样本推断 | 中或低：需要额外实验验证 |

证据索引如下。源码和测试随仓库提供；`.reports/` 是本机中间产物，不作为公开 fixture，其他机器可能没有这些文件。原始记录可能含 Cookie、用户数据和本地路径，不应复制进本文或提交到仓库。

| 编号 | 位置 | 本文使用的事实 |
| --- | --- | --- |
| C1 | [client.ts](../client.ts)：`decodeCapture`、`captureProfile`、`loadProfile`、`savePrivate` | 抓包筛选、凭据保存、模板处理 |
| C2 | [client.ts](../client.ts)：`envelope`、`Client.request/im/info/listPage/messages/rename/delete` | HTTP、IM 信封与会话接口 |
| C3 | [client.ts](../client.ts)：`completionBody`、`Client.send`、`sseEvents`、`StreamState` | 创建、续聊、流式聚合 |
| C4 | [cli.ts](../cli.ts)、[doubao-work](../doubao-work) | 参数解析、输出、tsx 启动 |
| T1 | [client.test.ts](../client.test.ts) | 精度、分页、模板、SSE、权限与删除边界 |
| T2 | [cli.test.ts](../cli.test.ts) | 顶层/子命令 `-p`、续聊、输出和参数错误 |
| T3 | [transport.test.ts](../transport.test.ts) | 提前 EOF、错误事件、超时、结束后关闭流、无重试 |
| L1 | `.reports/doubao-work-cli/initial.json` | recent_conv 抓包：cmd 3200、请求信封及成功响应 |
| L2 | `.reports/doubao-work-cli/rename.json` | update_name 抓包：cmd 4150、status_code=0 |
| L3 | `.reports/doubao-work-cli/test-session.json` | completion 请求，以及 info、single 的请求/响应 |
| L4 | `.reports/doubao-work-cli/validation.json`、`deleted-get.json`、`full-history.json` | 早期 Python 实现的实测记录；删除后 status=2，历史 2 条且 has_more=false |
| L5 | `.reports/doubao-work-cli/ts-live-create.json`、`ts-live-continue.json` | TS 创建及续聊均返回 `TS_CLI_OK`，finished=true |
| L6 | `.reports/doubao-work-cli/ts-cleanup-check.json` | 按测试标题过滤的全分页结果为空，has_more=false |

证据边界：L4 中 `tests=16` 是早期 Python 测试数，不能当成 TypeScript 测试数；迁移时 TS 验证为 31 项通过。L6 使用原测试标题，而会话后来改过名，因此空结果不能单独证明删除成功；删除判断依赖详情读回和当次执行记录。L5 是 CLI 聚合结果，原始 SSE 结构应查 L3，不能由聚合结果反推所有事件字段。

## 2. 架构与执行方式

调用链为：shell wrapper → 仓库内 `tsx` → `cli.ts`（commander）→ `client.ts`（协议与传输）→ `https://www.doubao.com`。普通请求使用 Node 原生 `fetch`；Bifrost 仅用于 `auth capture` 读取已经捕获的请求。启动 CLI 不会自动启动豆包工作或配置代理。**依据 C1–C4，置信度高。**

实现只提供非交互会话管理：列表、标题过滤、详情、历史、发送首条提示创建、续聊、重命名、删除。`-p` 兼容单次提示的使用习惯，不代表实现了 Kimi 的本地工具执行器。涉及本地文件或工具的任务依赖豆包工作运行环境；当前实测只覆盖文本 CRUD 和上下文续聊，独立执行任意工具的能力未验证。**范围依据 C3/C4、L4/L5，置信度高；客户端工具通道的完整工作机制置信度低，未在本项目实现。**

## 3. 接口与请求格式

### 3.1 通用 HTTP 与 IM 信封

以下接口均使用 `POST`。IM 请求使用 profile 的 `query`，completion 使用 `completion_query`；两者复用同一份 `headers`。实现固定 HTTPS origin，禁止自动跳转，发送 JSON，不自动重试。**依据 C2，置信度高。**

IM 请求信封（示意，不含真实账号数据）：

```json
{
  "cmd": 1110,
  "uplink_body": {
    "get_conv_info_uplink_body": {
      "conversation_id": "SESSION_ID",
      "conversation_type": 3,
      "bot_id": "",
      "option": { "need_bot_info": true },
      "ext": {}
    }
  },
  "sequence_id": "NEW_UUID",
  "channel": 2,
  "version": "1"
}
```

每次生成新的 `sequence_id`。HTTP 成功后仍要求响应含 `status_code` 且其值为 `0`；指定了 downlink 名称的读取接口还检查对应字段存在。`status_code` 缺失、非零、JSON 无效均按失败处理。**依据 C2、T1、L1–L3，置信度高。**

### 3.2 会话接口表

| CLI 功能 | POST 路径 | cmd / uplink_body 键 | 关键字段与响应处理 | 依据 / 置信度 |
| --- | --- | --- | --- | --- |
| list / search | `/im/chain/recent_conv` | 3200 / `pull_recent_conv_chain_uplink_body` | `conv_version`、`direction`、`limit`、`option.pc_pin_query_type`；读取 `pull_recent_conv_chain_downlink_body` | C2、T1、L1/L4；高 |
| get | `/im/conversation/info` | 1110 / `get_conv_info_uplink_body` | 字符串 `conversation_id`、type=3；读取 `get_conv_info_downlink_body.conversation_info` | C2、L3；高 |
| messages | `/im/chain/single` | 3100 / `pull_singe_chain_uplink_body` | `anchor_index`、`direction`、`limit`、type=3；读取 `pull_singe_chain_downlink_body` | C2、T1、L3/L4；高 |
| rename | `/im/conversation/update_name` | 4150 / `update_conversation_name_uplink_body` | `conversation_id`、type=3、`name`；随后 info 读回标题 | C2、L2/L4；高 |
| delete | `/im/conversation/batch_del_user_conv` | 4171 / `batch_delete_user_conversation_uplink_body` | 单元素 `conversation_id` 数组、type=3、`delete_all=false`；info 读回 status=2 | C2、T1/T2、L4；高（本次实验） |
| create / send / 顶层 -p | `/chat/completion` | 无 IM cmd，独立 JSON 请求体 | `client_meta`、`messages`、`option`、`user_context`、`ext`；响应 SSE | C3、T1/T3、L3/L5；高 |

`pull_singe_chain_*` 中的 `singe` 是捕获协议的原始拼写，不应改为 `single`。`conversation_type=3` 是本实现使用且实验成功的值；本文不推断其他类型含义。**依据 C2、L3，置信度高。**

抓包还出现 `/im/conversation/batch_get`（1111）和 `/im/conversation/modify`（1114），CLI 未使用。早期实验记录称 `/im/conversation/create` 返回了默认旧会话，故本实现通过 completion 创建；这只支持当前场景下的选择，不证明 create 接口在所有场景都不能新建会话。**前者依据 L1/L3，置信度高；后者依据既有 [AGENTS.md](../AGENTS.md) 实验说明，置信度中，缺少完整对照实验。**

### 3.3 分页、搜索和整数精度

- 列表首个 `conv_version=0` 请求使用 `direction=3`，后续非零游标使用 `direction=1`。同时传递服务端返回的 `next_conv_version` 和 `extra.pc_pin_query_type`，按二者组合检测循环；置顶分组切换时允许游标相同而分组不同。请求排除归档，且不拉每个会话的消息。
- `--all` 以 `has_more` 为继续条件，按会话 ID 去重；`--search` 只是对已拉取标题做不区分大小写的包含匹配，没有独立服务端搜索接口。
- 历史使用 `next_index` 作为下页 anchor，以 `has_more` 停止，按 message ID 去重，并按 `index_in_conv` 升序输出。默认 anchor=0、direction=2；方向的服务端语义未做所有边界的对照验证，不应从最终升序输出推断服务端原始排序。
- `lossless-json` 将超出安全整数范围的整数 token 解析为 BigInt，序列化仍为 JSON 数字。会话 ID 参数保留十进制字符串；协议数值游标使用 BigInt。消费者也必须避免用普通 JavaScript Number 读取大整数游标。

**实现依据 C2/T1，置信度高；置顶分页和历史读取有 L4 实测支持，跨版本方向语义置信度中。**

## 4. 创建、续聊与 SSE

### 4.1 从抓包模板构造请求

`auth capture` 清空 completion 的 `messages`、`user_context` 后保存其余模板，保留模型、设备、工作目录与运行环境参数。每次发送 clone 模板，重新生成本地会话 UUID、消息 UUID、block UUID、`unique_key` 与时间戳，构造一个 `block_type=10000` 文本块，并同步 `thread_local_message_id` 与序列化后的 `ext.general_task_param`。**依据 C1/C3、T1，置信度高。**

新建时 `need_create_conversation=true`、`conversation_id=""`、`last_message_index=null`；续聊先调用 info，填入服务端会话 ID、`last_section_id` 和 `msg_cursor`，设置 `need_create_conversation=false`。本实现不把完整历史重新拼进 prompt。**依据 C3、L5，置信度高；服务端如何存储及选择上下文未验证。**

续聊要求 status=1；若详情 extra 提供 agent 参数，检查 `local_device_id`、`workspace`、`runtime_type` 与模板匹配；若提供模型相关字段，检查 `model_item_key`、`reasoning_effort`、`mode_id`。缺少这些字段时不会凭空补做校验。因此“校验通过”不是运行环境一定可用的证明。**依据 C3/T1，置信度高。**

`create --title` 是“completion 完成后再 rename”两步操作，不是事务。第二步失败会保留已创建会话，并在错误中返回 session ID。**依据 C4，置信度高。**

### 4.2 流解析与完成条件

| 事件 | 当前实现处理 | 依据 / 置信度 |
| --- | --- | --- |
| `SSE_ACK` | 从 `ack_client_meta.conversation_id` 获取实际会话 ID | C3、T3；高（客户端行为） |
| `STREAM_CHUNK` | 遍历 patch；只接收无 parent 的 10000 文本块，patch_type=2 覆盖，否则追加 | C3、T1；高（覆盖的样本形态） |
| `FULL_MSG_NOTIFY` | 接收 user_type=2 的完整消息，按 message/block ID 更新文本快照 | C3、T1；高（客户端行为） |
| `STREAM_ERROR` | 立即失败，保留已确认的 session ID | C3、T3；高 |
| `SSE_REPLY_END` | 仅 end_type=3 标记完成；完成后主动结束读取 | C3、T1/T3、L5；高（当前实现与实验），其他 end_type 含义未知 |

解析器增量解码 UTF-8，支持网络分块切断字符、CRLF、行及事件；以空行结束事件，合并多行 data 后解析 JSON。提前 EOF、无最终结束事件、非法 JSON、超时或 SIGINT 均失败，不把部分输出报告为完整结果，也不自动重发写请求。默认超时 180 秒；completion 使用覆盖请求与读流的总期限，失败不代表服务端未执行。**依据 C3、T1/T3，置信度高。**

输出只提取当前识别的正文块，不转发原始 SSE 或已知非正文块。`stream-json` 的 `text_delta` 仅发布追加文本；覆盖 patch 和完整快照反映在最终 `result.text` 中，消费者应以最终结果为准。该过滤并非对未来所有协议形态的保证。**依据 C3/C4、T1/T2，置信度高。**

## 5. 鉴权逻辑与保存边界

### 5.1 登录态来源

CLI 没有账号密码登录、OAuth、API key 申请或自动刷新流程。用户先在豆包工作完成登录，再通过 Bifrost 捕获普通文本请求。默认查找最近的 HTTP 200、POST、对应路径且 `capp` 含 `DoubaoWork` 的记录，也允许显式传 request ID。**依据 C1，置信度高。**

解码抓包时验证 origin 恰为 `https://www.doubao.com`、URL 无用户名密码、POST、请求体完整且可解析、`aid=1044603`，并要求 Cookie 存在。默认 IM 来源是 `/im/conversation/info`；显式 ID 允许其他 `/im/` 路径。completion 来源必须为 `/chat/completion`，且拒绝带 regeneration/replace/select-text 标志的模板。**依据 C1，置信度高。**

### 5.2 复用哪些字段

| 字段 | 当前行为 | 已知事实与未验证部分 |
| --- | --- | --- |
| `cookie` | 必须存在，保存并随 IM/completion 发送 | 当前整套登录态可用（L4/L5）；未逐个移除 Cookie，不能认定其中某一个是唯一凭据 |
| `user-agent`、`content-type`、`agw-js-conv`、`referer`、`x-secsdk-csrf-token` | 抓包头白名单，存在则保存；发送时 content-type 统一设为 JSON | 源码行为确定；各头是否必需、CSRF token 的签发/绑定/过期规则未验证 |
| `query` / `completion_query` | 分别保留两类抓包 URL 参数 | `aid` 在抓包导入时强制为 1044603；其余参数的必要性未逐项验证 |
| `a_bogus`、`X-Bogus`、`msToken` | 导入时从 URL 参数移除，不实现生成算法 | 去除后的当前请求组合实验成功；不能推断服务端永久不校验这些字段或不存在其他风控条件 |
| completion 模板 | 清空提示数组与 user_context，保留其余运行环境 | 不是对所有嵌套字段的递归脱敏，仍可能含工作目录、设备标识和业务元数据 |

**实现依据 C1/C2，置信度高；现有组合可用依据 L4/L5，置信度高；“单个鉴权字段必需/可省略”及签名规则的结论置信度低，尚未进行消融实验。**

两类请求实际使用 **IM 抓包的 headers**，没有单独保存 completion headers，也没有验证两份抓包属于同一账号、同一登录时段。抓包时应来自同一次预期登录；当前实现没有账号一致性证明。`loadProfile` 只做基础 schema/Cookie/query 检查，不会重新执行抓包时的所有校验。**依据 C1/C2，置信度高。**

### 5.3 存储、验证与失效

默认配置为 `~/.config/doubao-work-cli/profile.json`，可用 `--profile` 覆盖。保存使用随机临时文件、`wx` 创建、权限 `0600`，写完 rename 原子替换；这是本地明文文件权限保护，不是加密或系统钥匙串。父目录权限没有专门收紧。**依据 C1/T1，置信度高。**

`auth capture` 只生成配置，不验证账号线上可用；`auth status` 真实调用 `listPage(1)`，通过 HTTP 和 IM 业务状态检查后才返回 authenticated=true。它证明此时列表接口可用，不能证明 completion 模板、工具通道或未来登录状态有效。Cookie 生命周期、刷新机制、设备绑定及错误码分类尚未实现或验证；失效后重新捕获。**依据 C1/C2/C4、L4，置信度高。**

## 6. 可复核验证与剩余不确定性

在仓库根目录运行：

```sh
pnpm run doubao-work:test
pnpm run doubao-work:typecheck
```

测试不读取真实凭据，验证的是客户端协议处理。线上复核可用独立临时会话执行：auth status → create → get/messages → send → rename → delete --yes；保留每步结果，并按同一 session ID 核对读回。不要仅用旧标题搜索为空来认定删除，也不要在写请求超时后直接重复 create。

| 结论 | 置信度 | 限制或下一步证据 |
| --- | --- | --- |
| 当前版本下文本会话 CRUD 与续聊可用 | 高 | C/T/L 多类证据；其他版本需重新实测 |
| 删除表现为详情 status=2，而非详情立即不可查询 | 高（当前实验） | 不等于数据物理清除，也不证明保留策略 |
| Cookie + 捕获上下文足以完成当前请求 | 高（当前组合） | 最小必要字段集合、有效期和绑定规则未知 |
| 省略三个 URL 参数在当前实验可行 | 高（当前样本） | 普遍可省略的结论置信度低，需分接口/账号/时间测试 |
| 模型、设备与工作目录字段与续聊上下文有关 | 中 | 当前匹配检查是客户端保守策略；服务端强制条件尚未逐项验证 |
| 完整替代 Kimi 的本地工具执行能力 | 未建立 | 不在实现范围，文本续聊成功不能作为工具执行证明 |

本文未调用或引用外部官方文档；所有协议判断来自上述源码、测试与本地实验。今后修改接口、模板、鉴权或 SSE 行为时，应同步更新对应证据和置信度，而不是只修改接口表。
