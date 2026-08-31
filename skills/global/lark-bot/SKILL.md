---
name: lark-bot
description: Use the local Lark Bot HTTP CLI to check service health, send text messages or test cards, list received events, and process or retry events. Use when the user asks to operate llm-wiki/lark/bot through its CLI.
---

# Lark Bot CLI

Run commands from `/Users/liutao/workspace/agent/llm-wiki/lark/bot` unless the user provides another checkout.

```bash
pnpm cli health
pnpm cli send --receive-id oc_xxx --receive-id-type chat_id --text "你好"
pnpm cli events --limit 20
pnpm cli process evt_xxx
pnpm cli send-card --email user@example.com
pnpm cli send-booking-card --email user@example.com --request-id req_xxx --class-name "课程" --gym-name "门店" --start-time "2026-08-12 18:40" --end-time "19:40" --online-cost 2900
pnpm cli send-course-list-card --email user@example.com --request-id req_xxx --date 2026-08-15 --gym-name "门店" --courses-json '[{"scheduleId":"s1","className":"课程","coachName":"教练","startTime":"18:40","endTime":"19:40","onlineCost":2900}]'
pnpm cli card-actions --request-id req_xxx
```

Pass `--base-url http://host:port` or set `LARK_BOT_URL` when the service is not local.

`health` and `events` are read-only. `send`, `send-card`, and event processing or retry can cause external writes; execute them only after the user explicitly authorizes the recipient, content, and action.
