---
name: supermonkey-booking
description: 获取字节健康/青橙超级猩猩接口登录态，使用 TypeScript CLI 查询门店、课程、补贴并创建支付宝待支付订单，以及通过 Botmux gateway 发送卡片、接收按钮选择并发送支付链接。用户询问超级猩猩登录态、CLI 命令或飞书通知方式时使用。
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

## 飞书消息与卡片交互

统一通过 [`$lark-card`](../lark-card/SKILL.md) 核验收件人及完整 Botmux 会话；默认收件人为 `liutao.fe@bytedance.com`。在运行发卡流程前设置 `BOTMUX_SESSION_ID` 为该已核验会话。它只用于选择发送目标，不代表 Botmux 原生提问会话；不得补造其他会话环境来运行 `ask`。

`card-gateway.ts` 调用项目 [botmux-card-confirmation](../../../apps/botmux-card-confirmation/AGENTS.md) 构建后的共享客户端（`apps/botmux-card-confirmation/dist/client.js`，类型声明由构建自动生成）。课程列表、下单确认、支付链接和结果通知全部由 Botmux 中转；按钮事件通过 `card-confirmation` 插件接收。先按插件说明构建、启动服务并检查健康，保持运行直到选择流程结束。普通卡片发送只需 Botmux 在线。

其他收件人需另提供已核验的 `BOTMUX_CARD_TARGET_JSON`，包含 `email`、`larkAppId`、`chatId`、`operatorId`，并指定该私聊的 `BOTMUX_SESSION_ID`。不再使用旧服务的 `LARK_BOT_DIR`、`LARK_BOT_URL` 或 `pnpm cli`。

`request-order` 的确认卡片包含课程、门店、时间、个人支付金额和“是/否”按钮。`workflow` 提供课程选择和取消选项。两者只接受当前请求的真实 Botmux 决定，拒绝 `testOnly`；回调仅记录选择，业务流程再检查参数并创建一次支付宝待支付订单。课程或费用变化需重新确认。支付链接通过 Botmux 发送，禁止自动打开支付应用或代用户完成付款。
