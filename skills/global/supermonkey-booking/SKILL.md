---
name: supermonkey-booking
description: 获取字节健康/青橙超级猩猩接口登录态，使用 TypeScript CLI 查询门店、课程、补贴并创建支付宝待支付订单，以及通过 lark-card 发送课程与预约信息、处理按钮确认并发送支付链接。用户询问超级猩猩登录态、CLI 命令或飞书通知方式时使用。
---

# 超级猩猩预约

## 获取登录态

移动端操作使用 Android SDK 的 AVD（Android Emulator），不使用 MuMu。先通过 `adb devices -l` 和 `emulator -list-avds` 检查并复用已有 AVD；未运行时启动已有虚拟设备，不新建或清空设备。按 `$android-device-automation` 操作其中的飞书。桌面飞书提示“仅支持移动端”时，转到 AVD 继续，不将 MuMu 的登录状态作为本流程的阻碍。

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

在项目根目录执行 `cd skills/global/supermonkey-booking` 后运行；首次使用先执行 `npm install`。脚本由 `tsx` 执行，请求使用原生 `fetch`。

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

`workflow.ts` 接收日期和 `qc-session-id`，查询天府三街当天 18:30–21:00 的可预约课程，向 `liutao.fe@bytedance.com` 发送带课程下拉框和“预订”按钮的卡片；用户点击预订后重新校验，再创建支付宝待支付订单并发送支付链接。点击取消不下单。优先通过 `QINGCHENG_SESSION_ID` 环境变量传递会话，避免凭据进入 shell 历史；`--dry-run` 只执行只读查询并输出脱敏后的课程列表。

### 已观测标识

- 字节跳动企业 ID：`QC0DA3DA`
- 天府三街门店 ID：`9QqlGw2W`
- 示例排期 ID：`XPm6K3QL`
- 支付宝渠道：`ALIPAY_QRCODE`

这些标识是历史观测值。查询课程或创建订单前必须重新获取当前排期、价格和补贴。

需要查询接口路径、请求字段和错误语义时读取 [references/api.md](references/api.md)。

## 通过 lark-card 发送信息与确认

课程查询结果、门店与时间、价格和补贴、无可预约课程提示、下单确认、支付链接及预约结果，统一通过 [`$lark-card`](../lark-card/SKILL.md) 发送卡片。需要用户选择或确认时，使用同一技能的 button action；不能用只在终端输出的信息替代面向用户的信息卡片。`--dry-run` 保持只输出预览，不发送卡片。

查询到可预约课程时，默认使用同一张卡片上的课程下拉框（`select_static`）和“预订”按钮，不把每节课程渲染为按钮。调用共享插件时传入 `selection: {placeholder: "请选择课程", submitLabel: "预订"}`，课程选项使用 `result: "confirmed"`，另加 `result: "rejected"` 的取消选项。下拉范围覆盖本次展示的课程，选项注明时间、课程、教练与个人支付金额。不预选课程；更改下拉选项不下单，只有点击预订才提交表单。收到真实提交后重新核验课程、时间、教练、余位与个人支付金额；有变化时重新确认，未变化时创建一次待支付订单。必须接通真实 Botmux 回调及后续处理后再发卡，不能发送无人消费的预订按钮。

发送前按 `lark-card` 核验收件人及完整 Botmux 会话；默认收件人为 `liutao.fe@bytedance.com`。在运行发卡流程前设置 `BOTMUX_SESSION_ID` 为该已核验会话。它只用于选择发送目标，不代表 Botmux 原生提问会话；不得补造其他会话环境来运行 `ask`。

默认按 [lark-card 本地读取流程](../lark-card/references/default.md) 处理按钮：`actionHandling: {mode: "local"}`，回调保存结果，当前工作流通过 `waitForChoice` 轮询同一请求并继续。现有 `workflow` 和 `request-order` 使用此模式；不要同时配置 resume 让另一个会话消费同一决定。若另行实现会话恢复流程，应按 lark-card 的 resume 约定声明 agent 类型，并交接业务步骤及防重复执行状态。

`card-gateway.ts` 是本业务对 lark-card 共享能力的适配层，调用项目 [botmux-card-confirmation](../../../apps/botmux-card-confirmation/AGENTS.md) 构建后的共享客户端（`apps/botmux-card-confirmation/dist/client.js`，类型声明由构建自动生成）。`sendMessage` 将普通信息包装成 schema 2.0 卡片，`sendConfirmation` 注册允许的按钮选项。课程列表、下单确认、支付链接和结果通知全部通过 lark-card 的 Botmux 网关中转；按钮事件通过 `card-confirmation` 插件接收。先按插件说明构建、启动服务并检查健康，保持运行直到选择流程结束。普通卡片发送只需 Botmux 在线。

其他收件人需另提供已核验的 `BOTMUX_CARD_TARGET_JSON`，包含 `email`、`larkAppId`、`chatId`、`operatorId`，并指定该私聊的 `BOTMUX_SESSION_ID`。不再使用旧服务的 `LARK_BOT_DIR`、`LARK_BOT_URL` 或 `pnpm cli`。

`request-order` 的确认卡片包含课程、门店、时间、个人支付金额和“是/否”按钮。`workflow` 提供课程选择和取消选项。两者只接受当前请求的真实 Botmux 决定，拒绝 `testOnly`；回调仅记录选择，业务流程再检查参数并创建一次支付宝待支付订单。课程或费用变化需重新确认。支付链接通过 lark-card 发送卡片，禁止自动打开支付应用或代用户完成付款。
