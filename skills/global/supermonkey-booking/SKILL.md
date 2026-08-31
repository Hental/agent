---
name: supermonkey-booking
description: 获取字节健康/青橙超级猩猩接口登录态，使用 TypeScript CLI 查询门店、课程、补贴并创建支付宝待支付订单，以及通过本地 lark-bot 发送下单确认卡片和支付链接。用户询问超级猩猩登录态、CLI 命令或飞书通知方式时使用。
---

# 超级猩猩预约

## 获取登录态

登录态来自已登录飞书账号打开“工作台 → 字节健康 → 合作健身房”后的青橙 WebView 请求，不能使用匿名浏览器 Cookie。飞书账号不正确时先切换账号。

使用 Bifrost 仅拦截 `yql.qingchengfit.cn`，在 WebView 中刷新门店或课程页面后，运行 `auth.ts` 从最近的成功请求中提取 `qc-session-id`：

```bash
bifrost status
export QINGCHENG_SESSION_ID="$(npm run -s auth)"
```

也可让脚本生成可检查后执行的 export 命令：

```bash
npm run -s auth -- --format export
```

默认查询最近 10 分钟流量，可用 `--latest 2h` 调整。若 Bifrost 尚未解密该域名的 HTTPS，先按 `$bifrost` 的 CA 与域名白名单流程配置 TLS 拦截，再重新触发请求。脚本只向当前终端输出 `qc-session-id`，不会输出完整 Cookie。该值属于敏感登录凭据：禁止复制到聊天、写入 Skill、代码、日志或 Git；使用完执行 `unset QINGCHENG_SESSION_ID`。

## CLI 命令

在 `/Users/liutao/workspace/agent/skills/global/supermonkey-booking` 运行；首次使用先执行 `npm install`。脚本由 `tsx` 执行，请求使用原生 `fetch`。

```bash
npm run supermonkey -- stores --lat 30.5705 --lon 104.0688 --city-code 510100
npm run supermonkey -- store-detail --gym-id 9QqlGw2W
npm run supermonkey -- schedules --gym-id 9QqlGw2W --from-date 2026-08-12 --to-date 2026-08-12
npm run supermonkey -- preflight --schedule-id XPm6K3QL --biz-type 1
npm run supermonkey -- create-order --schedule-id XPm6K3QL --general-card-id 189982 --online-cost 2900
npm run supermonkey -- request-order --schedule-id XPm6K3QL --general-card-id 189982 --online-cost 2900 --class-name "课程名" --gym-name "超级猩猩·天府三街" --start-time "2026-08-12 18:40" --end-time "19:40"
npm run workflow -- 2026-08-15 --qc-session-id "$QINGCHENG_SESSION_ID"
```

也可直接运行 `npx tsx scripts/supermonkey.ts <command>`。`create-order` 只预览参数；只有 `request-order` 会在飞书确认后提交一个订单。金额单位为分。添加 `--dry-run` 可检查下单参数而不联网、不发消息、不创建订单。

`workflow.ts` 接收日期和 `qc-session-id`，查询天府三街当天 18:30–21:00 的可预约课程，向 `liutao.fe@bytedance.com` 发送课程选择卡片；选择课程后重新校验并创建支付宝待支付订单，再发送支付链接。点击“取消预订”时不下单。优先通过 `QINGCHENG_SESSION_ID` 环境变量传递会话，避免凭据进入 shell 历史；`--dry-run` 只执行只读查询并输出脱敏后的课程列表。

### 已观测标识

- 字节跳动企业 ID：`QC0DA3DA`
- 天府三街门店 ID：`9QqlGw2W`
- 示例排期 ID：`XPm6K3QL`
- 支付宝渠道：`ALIPAY_QRCODE`

这些标识是历史观测值。查询课程或创建订单前必须重新获取当前排期、价格和补贴。

需要查询接口路径、请求字段和错误语义时读取 [references/api.md](references/api.md)。

## 飞书消息发送

使用 [`$lark-bot`](/Users/liutao/workspace/agent/skills/global/lark-bot/SKILL.md)，默认项目目录为 `/Users/liutao/workspace/agent/llm-wiki/lark/bot`，默认收件人为 `liutao.fe@bytedance.com`。

```bash
cd /Users/liutao/workspace/agent/llm-wiki/lark/bot
pnpm cli health
pnpm cli send --receive-id liutao.fe@bytedance.com --receive-id-type email --text "消息内容"
pnpm cli send-booking-card --email liutao.fe@bytedance.com --request-id req_xxx --class-name "课程名" --gym-name "超级猩猩·天府三街" --start-time "2026-08-12 18:40" --end-time "19:40" --online-cost 2900
pnpm cli card-actions --request-id req_xxx
```

`request-order` 会发送仅含“是/否”的确认卡片；只接受同一 `requestId` 的“是”回调，然后重新预检、创建一次支付宝待支付订单，并把支付链接发送给收件人。点击“否”时不下单。禁止自动打开支付应用或代用户完成付款。
