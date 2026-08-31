#!/usr/bin/env -S npx tsx

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

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
const larkBotDir = process.env.LARK_BOT_DIR ?? "/Users/liutao/workspace/agent/llm-wiki/lark/bot";
const larkBotBaseUrl = process.env.LARK_BOT_URL;
const execFileAsync = promisify(execFile);

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

async function runLarkBot(argv: string[]): Promise<unknown> {
  const cliArgs = ["cli", ...argv];
  if (larkBotBaseUrl) cliArgs.push("--base-url", larkBotBaseUrl);
  const { stdout, stderr } = await execFileAsync("pnpm", cliArgs, {
    cwd: larkBotDir,
    env: process.env,
    maxBuffer: 4 * 1024 * 1024,
  });
  const raw = stdout.trim();
  if (!raw) throw new Error(`lark-bot CLI 未返回 JSON：${stderr.trim()}`);
  const jsonStart = raw.indexOf("{");
  if (jsonStart < 0) throw new Error(`lark-bot CLI 输出不是 JSON：${raw.slice(0, 300)}`);
  return JSON.parse(raw.slice(jsonStart)) as unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("预期得到对象类型的数据");
  return value as Record<string, unknown>;
}

function durationMs(value: string): number {
  const match = /^(\d+)([smh])$/.exec(value);
  if (!match) throw new Error("--confirmation-timeout 格式应类似 30m、60s 或 1h");
  const amount = Number(match[1]);
  return amount * ({ s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as "s" | "m" | "h"]);
}

async function waitForDecision(requestId: string, timeout: string): Promise<"confirm" | "cancel"> {
  const deadline = Date.now() + durationMs(timeout);
  while (Date.now() < deadline) {
    const response = asRecord(await runLarkBot(["card-actions", "--request-id", requestId]));
    const actions = Array.isArray(response.actions) ? response.actions.map(asRecord) : [];
    const action = actions.find((item) => item.requestId === requestId)?.action;
    if (action === "confirm_order") return "confirm";
    if (action === "cancel_order") return "cancel";
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("等待飞书卡片确认超时");
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
  const requestId = randomUUID();
  const bookingCardArgs = [
    "send-booking-card", "--email", recipientEmail, "--request-id", requestId,
    "--class-name", option("class-name"), "--gym-name", option("gym-name"),
    "--start-time", option("start-time"), "--end-time", option("end-time"),
    "--online-cost", String(body.online_cost),
  ];
  if (hasFlag("dry-run")) {
    print({ dry_run: true, recipient: recipientEmail, order: body, lark_bot: { cwd: larkBotDir, args: bookingCardArgs } });
    return;
  }
  await fetchPreflight(body.schedule_id, corpId, bizType);
  const sent = asRecord(await runLarkBot(bookingCardArgs));
  if (sent.ok !== true || typeof sent.messageId !== "string") throw new Error("lark-bot 响应中缺少 messageId");
  const decision = await waitForDecision(requestId, option("confirmation-timeout", "30m"));
    if (decision === "cancel") {
      print({ cancelled: true, message_id: sent.messageId, recipient: recipientEmail });
      return;
    }
    await fetchPreflight(body.schedule_id, corpId, bizType);
    const order = await submitOrder(body);
    const paymentUrl = findPaymentUrl(order.data);
    if (!paymentUrl) throw new Error("订单已创建，但响应中没有找到 HTTP(S) 支付宝支付链接");
    const paymentMessage = asRecord(await runLarkBot([
      "send", "--receive-id", recipientEmail, "--receive-id-type", "email",
      "--text", `支付宝待支付订单已创建：${paymentUrl}`,
    ]));
    if (paymentMessage.ok !== true) throw new Error("lark-bot 发送支付宝链接失败");
    print({ created: true, recipient: recipientEmail, payment_url: paymentUrl, order });
}

function help(): void {
  process.stdout.write(`超级猩猩预约 CLI\n飞书消息：lark-bot（${larkBotDir}）\n\n命令：\n  stores --lat N --lon N --city-code CODE [--page N] [--corp-id ID]\n    查询附近合作门店\n  store-detail --gym-id ID\n    查询门店详情\n  schedules --gym-id ID --from-date YYYY-MM-DD --to-date YYYY-MM-DD [--corp-id ID]\n    查询指定日期范围的课程排期\n  preflight --schedule-id ID [--biz-type 1] [--corp-id ID]\n    查询预约弹窗和可用补贴\n  create-order --schedule-id ID --general-card-id ID --online-cost FEN [--channel ALIPAY_QRCODE]\n    仅预览创建订单请求，不会提交\n  request-order --schedule-id ID --general-card-id ID --online-cost FEN --class-name TEXT --gym-name TEXT --start-time TEXT --end-time TEXT [--recipient-email EMAIL] [--confirmation-timeout 30m] [--dry-run]\n    通过 lark-bot 发送确认卡片；仅在点击“是”后创建订单并发送支付宝链接\n`);
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
