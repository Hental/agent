#!/usr/bin/env -S npx tsx

import { sendConfirmation, sendMessage, waitForChoice } from "./card-gateway.js";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

interface ApiEnvelope<T extends Json = Json> {
  status: number;
  msg?: string;
  info?: string;
  level?: string;
  error_code?: string;
  data: T;
}

const args = process.argv.slice(2);
const command = args[0] ?? "help";
const options = parseOptions(args.slice(1));

const baseUrl = (process.env.QINGCHENG_BASE_URL ?? "https://yql.qingchengfit.cn").replace(/\/$/, "");
const defaultCorpId = process.env.QINGCHENG_CORP_ID ?? "QC0DA3DA";
const defaultRecipientEmail = "liutao.fe@bytedance.com";

function parseOptions(tokens: string[]): Map<string, string | true> {
  const parsed = new Map<string, string | true>();
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      throw new Error(`无法识别的参数：${token}`);
    }
    const key = token.slice(2);
    const next = tokens[index + 1];
    if (next && !next.startsWith("--")) {
      parsed.set(key, next);
      index += 1;
    } else {
      parsed.set(key, true);
    }
  }
  return parsed;
}

function option(name: string, fallback?: string): string {
  const value = options.get(name);
  if (typeof value === "string") return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`缺少必填参数 --${name}`);
}

function integerOption(name: string, fallback?: number): number {
  const raw = options.get(name);
  if (raw === undefined && fallback !== undefined) return fallback;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new Error(`--${name} 必须是非负整数`);
  }
  return Number(raw);
}

function numberOption(name: string): number {
  const raw = option(name);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`--${name} 必须是数字`);
  return value;
}

function hasFlag(name: string): boolean {
  return options.get(name) === true;
}

function cookie(): string {
  const value = process.env.QINGCHENG_COOKIE;
  if (!value) {
    throw new Error("联网请求必须设置 QINGCHENG_COOKIE");
  }
  return value;
}

async function request<T extends Json>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      cookie: cookie(),
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let payload: ApiEnvelope<T>;
  try {
    payload = JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new Error(`${path} 未返回有效 JSON；HTTP ${response.status}：${text.slice(0, 300)}`);
  }

  if (!response.ok || payload.status !== 200 || payload.level === "error") {
    throw new Error(`API 请求失败（${response.status}/${payload.status}）：${payload.msg ?? payload.info ?? "未知错误"}`);
  }
  return payload;
}

function query(path: string, params: Record<string, string | number | boolean>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) search.set(key, String(value));
  return `${path}?${search.toString()}`;
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function stores(): Promise<void> {
  const payload = await request(query("/api/corp/company/gyms/", {
    lat: numberOption("lat"),
    lon: numberOption("lon"),
    gd_city_code: option("city-code"),
    page: integerOption("page", 1),
    qc_corpid: option("corp-id", defaultCorpId),
  }));
  print(payload);
}

async function storeDetail(): Promise<void> {
  const gymId = encodeURIComponent(option("gym-id"));
  print(await request(`/api/corp/company/partner/gyms/${gymId}/`));
}

async function schedules(): Promise<void> {
  const payload = await request(query("/api/corp/company/supermonkey/schedules/", {
    order_by: "start",
    from_date: option("from-date"),
    to_date: option("to-date"),
    show_all: 1,
    gym_id: option("gym-id"),
    qc_corpid: option("corp-id", defaultCorpId),
  }));
  print(payload);
}

async function preflight(): Promise<void> {
  const scheduleId = option("schedule-id");
  const corpId = option("corp-id", defaultCorpId);
  print(await fetchPreflight(scheduleId, corpId, integerOption("biz-type", 1)));
}

async function fetchPreflight(scheduleId: string, corpId: string, bizType: number): Promise<{ dialog: ApiEnvelope; subsidy: ApiEnvelope }> {
  const [dialog, subsidy] = await Promise.all([
    request(query("/api/mini_program_c/supermonkey/dialog/query/", {
      schedule_id: scheduleId,
      biz_type: bizType,
    })),
    request(query("/api/corp/company/subsidy/available/", {
      supermonkey_schedule_id: scheduleId,
      qc_corpid: corpId,
    })),
  ]);
  return { dialog, subsidy };
}

async function createOrder(): Promise<void> {
  const body = orderBody();
  print({
    dry_run: true,
    message: "请使用 request-order；只有匹配的飞书卡片确认才能提交订单",
    request: body,
  });
}

function orderBody(): { general_card_id: number; sub_channel: string; online_cost: number; schedule_id: string } {
  return {
    general_card_id: integerOption("general-card-id"),
    sub_channel: option("channel", "ALIPAY_QRCODE"),
    online_cost: integerOption("online-cost"),
    schedule_id: option("schedule-id"),
  };
}

async function submitOrder(body: ReturnType<typeof orderBody>): Promise<ApiEnvelope> {
  return request("/api/corp/company/supermonkey/order/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function durationMs(value: string): number {
  const match = /^(\d+)([smh])$/.exec(value);
  if (!match) throw new Error("--confirmation-timeout 格式应类似 30m、60s 或 1h");
  const amount = Number(match[1]);
  return amount * ({ s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as "s" | "m" | "h"]);
}

async function waitForDecision(requestId: string, timeout: string): Promise<"confirm" | "cancel"> {
  const result = await waitForChoice(requestId, durationMs(timeout));
  if (result.status === "confirmed" && result.decision?.value === "confirm") return "confirm";
  if (result.status === "rejected") return "cancel";
  throw new Error("未知确认选项，未创建订单");
}

function findPaymentUrl(value: unknown): string | undefined {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findPaymentUrl(item); if (found) return found; }
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["alipay_url", "pay_url", "payment_url", "url", "qr_code"]) {
      const found = findPaymentUrl(record[key]);
      if (found) return found;
    }
    for (const child of Object.values(record)) { const found = findPaymentUrl(child); if (found) return found; }
  }
  return undefined;
}

async function requestOrder(): Promise<void> {
  const body = orderBody();
  const corpId = option("corp-id", defaultCorpId);
  const bizType = integerOption("biz-type", 1);
  const recipientEmail = option("recipient-email", defaultRecipientEmail);
  const timeout = option("confirmation-timeout", "30m");
  const card = {
    title: "超级猩猩 · 下单确认",
    summary: `课程：${option("class-name")}\n门店：${option("gym-name")}\n时间：${option("start-time")}–${option("end-time")}\n个人支付：${(body.online_cost / 100).toFixed(2)} 元\n确认后创建支付宝待支付订单，由你完成付款。`,
    expiresAt: new Date(Date.now() + durationMs(timeout)).toISOString(),
    context: { workflow: "supermonkey-order", order: body },
    options: [
      { id: "confirm", label: "是", result: "confirmed" as const, type: "primary" as const },
      { id: "reject", label: "否", result: "rejected" as const, type: "danger" as const },
    ],
  };
  if (hasFlag("dry-run")) {
    print({ dry_run: true, recipient: recipientEmail, order: body, gateway: "botmux", card });
    return;
  }
  await fetchPreflight(body.schedule_id, corpId, bizType);
  const sent = await sendConfirmation(card, recipientEmail);
  const decision = await waitForDecision(sent.requestId, timeout);
  if (decision === "cancel") {
    print({ cancelled: true, message_id: sent.messageId, recipient: recipientEmail });
    return;
  }
  await sendMessage(`已收到你的预订请求：${option("class-name")}（${option("start-time")}–${option("end-time")}）。\n正在核验并创建支付宝待支付订单，付款由你完成。`, recipientEmail, "超级猩猩 · 已收到");
  let orderSubmitted = false;
  let orderCreated = false;
  try {
    await fetchPreflight(body.schedule_id, corpId, bizType);
    orderSubmitted = true;
    const order = await submitOrder(body);
    orderCreated = true;
    const paymentUrl = findPaymentUrl(order.data);
    if (!paymentUrl) throw new Error("订单已创建，但响应中没有找到 HTTP(S) 支付宝支付链接");
    await sendMessage(`支付宝待支付订单已创建：[打开支付链接](${paymentUrl})`, recipientEmail);
    print({ created: true, recipient: recipientEmail, payment_url: paymentUrl, order });
  } catch (error) {
    const status = orderCreated
      ? "待支付订单已创建，但支付链接未能完整获取或送达。请先核对订单，不要重复预订。"
      : orderSubmitted
        ? "订单提交结果未能确认，请先核对订单记录；本流程不会自动重试下单。"
        : "预约核验未通过或查询暂不可用，未创建订单。";
    await sendMessage(status, recipientEmail, "超级猩猩 · 预订处理结果");
    throw error;
  }
}

function help(): void {
  process.stdout.write(`超级猩猩预约 CLI\n飞书消息与卡片回调：Botmux gateway（需要已核验的 BOTMUX_SESSION_ID）\n\n命令：\n  stores --lat N --lon N --city-code CODE [--page N] [--corp-id ID]\n    查询附近合作门店\n  store-detail --gym-id ID\n    查询门店详情\n  schedules --gym-id ID --from-date YYYY-MM-DD --to-date YYYY-MM-DD [--corp-id ID]\n    查询指定日期范围的课程排期\n  preflight --schedule-id ID [--biz-type 1] [--corp-id ID]\n    查询预约弹窗和可用补贴\n  create-order --schedule-id ID --general-card-id ID --online-cost FEN [--channel ALIPAY_QRCODE]\n    仅预览创建订单请求，不会提交\n  request-order --schedule-id ID --general-card-id ID --online-cost FEN --class-name TEXT --gym-name TEXT --start-time TEXT --end-time TEXT [--recipient-email EMAIL] [--confirmation-timeout 30m] [--dry-run]\n    通过 Botmux 发送确认卡片；仅在点击“是”后创建订单并发送支付宝链接\n`);
}

async function main(): Promise<void> {
  switch (command) {
    case "stores": return stores();
    case "store-detail": return storeDetail();
    case "schedules": return schedules();
    case "preflight": return preflight();
    case "create-order": return createOrder();
    case "request-order": return requestOrder();
    case "help":
    case "--help":
    case "-h": return help();
    default: throw new Error(`无法识别的命令：${command}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`错误：${message}\n`);
  process.exitCode = 1;
});
