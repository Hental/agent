# 飞书 Bot 本地服务

基于 TypeScript、Hono 与飞书官方 Node.js SDK。服务通过 `WSClient` 长连接接收消息和卡片回调；独立 CLI 只通过 HTTP 与服务交互。

## 安装与配置

```bash
cd /Users/liutao/workspace/agent/llm-wiki/lark/bot
pnpm install
cp .env.example .env
```

在 `.env` 填入企业自建应用凭证：

```dotenv
LARK_BOT_ID=cli_xxxxxxxxxxxxxxxx
LARK_BOT_SK=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HOST=127.0.0.1
PORT=3000
EVENT_STORE_CAPACITY=500
PROCESS_CONCURRENCY=2
```

`autoReply=true`、回复前缀 `收到：`、域名 `feishu` 和日志级别 `info` 固定在 `src/config.ts`。

## 飞书后台

1. 启用机器人能力并开通消息所需权限，例如 `im:message`。
2. 发布应用版本，并确保目标用户在应用可用范围内。
3. 启动本地服务后，在「事件与回调 > 事件配置」选择长连接并添加 `im.message.receive_v1`。
4. 在回调配置中选择长连接，以接收 `card.action.trigger`。

长连接仅支持企业自建应用。收到事件后必须在 3 秒内返回，因此服务先保存事件，再在后台队列处理。

## 启动

```bash
pnpm start
# 开发模式
pnpm dev
```

## CLI

```bash
pnpm cli health
pnpm cli send --receive-id oc_xxx --receive-id-type chat_id --text "你好"
pnpm cli events --limit 20
pnpm cli process evt_xxx
pnpm cli send-card --email liutao.fe@bytedance.com
pnpm cli send-booking-card --email liutao.fe@bytedance.com --request-id req_xxx --class-name "燃脂训练" --gym-name "超级猩猩·天府三街" --start-time "2026-08-12 18:40" --end-time "19:40" --online-cost 2900
pnpm cli send-course-list-card --email liutao.fe@bytedance.com --request-id req_xxx --date 2026-08-15 --gym-name "超级猩猩·天府三街" --courses-json '[{"scheduleId":"s1","className":"燃脂训练","coachName":"教练","startTime":"18:40","endTime":"19:40","onlineCost":2900}]'
pnpm cli card-actions --request-id req_xxx
```

默认服务地址是 `http://127.0.0.1:3000`。可传 `--base-url`，或设置 `LARK_BOT_URL`。

事件状态为 `pending`、`processing`、`processed`、`failed`。`process` 可以处理待处理事件或重试失败事件；已经处理的事件不会重复回复。

测试卡使用 Card 2.0，包含「确认」和「取消」回调按钮。预约卡和课程列表卡展示课程、门店、时间和金额，按钮回调携带调用方提供的唯一 `requestId`；课程选择回调还携带 `scheduleId`。

## HTTP API

| Method | Path | 用途 |
|---|---|---|
| GET | `/health` | 服务、队列与事件数量 |
| POST | `/messages` | 主动发送文本消息 |
| GET | `/events?limit=50` | 获取最近事件 |
| GET | `/card-actions?requestId=req_xxx` | 查询指定预约请求的卡片操作 |
| POST | `/events/:eventId/process` | 处理或重试事件 |
| POST | `/cards/test` | 按邮箱发送双按钮测试卡 |
| POST | `/cards/booking` | 按邮箱发送超级猩猩预约确认卡 |
| POST | `/cards/course-list` | 按邮箱发送可选择课程的超级猩猩列表卡 |

## 验证

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level=moderate
```

测试使用 Rstest，且不会读取真实凭证、启动长连接或发送消息。

## 参考

- [服务端 SDK 开发前准备](https://open.feishu.cn/document/server-side-sdk/nodejs-sdk/preparation-before-development)
- [Node.js SDK 处理事件](https://open.feishu.cn/document/server-side-sdk/nodejs-sdk/handling-events?lang=zh-CN)
