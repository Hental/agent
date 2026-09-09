#!/usr/bin/env -S npx tsx

import { sendConfirmation, sendMessage, waitForChoice } from './card-gateway.js';

type RecordValue = Record<string, unknown>;

interface ApiEnvelope {
  status: number;
  msg?: string;
  info?: string;
  level?: string;
  data: unknown;
}

interface Course {
  scheduleId: string;
  className: string;
  coachName: string;
  startTime: string;
  endTime: string;
  onlineCost: number;
}

const GYM_ID = '9QqlGw2W';
const GYM_NAME = '超级猩猩·天府三街';
const CORP_ID = 'QC0DA3DA';
const APP_KEY = '6598c4e266a14d7da21802f6b6a7e273';
const RECIPIENT_EMAIL = 'liutao.fe@bytedance.com';
const START_MINUTES = 18 * 60 + 30;
const END_MINUTES = 21 * 60;
const baseUrl = (process.env.QINGCHENG_BASE_URL ?? 'https://yql.qingchengfit.cn').replace(/\/$/, '');

function parseArgs(argv: string[]): { date: string; sessionId: string; timeout: string; dryRun: boolean } {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write('用法: npx tsx scripts/workflow.ts YYYY-MM-DD --qc-session-id <值> [--confirmation-timeout 30m] [--dry-run]\n');
    process.exit(0);
  }
  const date = argv[0] ?? '';
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error('日期必须是有效的 YYYY-MM-DD，例如 2026-08-01');
  }
  const options = new Map<string, string | true>();
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) throw new Error(`无法识别的参数：${token}`);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options.set(token.slice(2), next);
      index += 1;
    } else {
      options.set(token.slice(2), true);
    }
  }
  const sessionOption = options.get('qc-session-id');
  const sessionId = typeof sessionOption === 'string' ? sessionOption : process.env.QINGCHENG_SESSION_ID ?? '';
  if (!sessionId || /[;\s]/.test(sessionId)) throw new Error('缺少有效的 --qc-session-id（也可设置 QINGCHENG_SESSION_ID）');
  const timeoutOption = options.get('confirmation-timeout');
  return {
    date,
    sessionId,
    timeout: typeof timeoutOption === 'string' ? timeoutOption : '30m',
    dryRun: options.get('dry-run') === true,
  };
}

function asRecord(value: unknown, message = '预期得到对象'): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value as RecordValue;
}

function asArray(value: unknown, message = '预期得到数组'): unknown[] {
  if (!Array.isArray(value)) throw new Error(message);
  return value;
}

function stringField(record: RecordValue, name: string, fallback = ''): string {
  const value = record[name];
  return typeof value === 'string' ? value : fallback;
}

function integerField(record: RecordValue, name: string): number {
  const value = record[name];
  if (!Number.isInteger(value)) throw new Error(`${name} 不是整数`);
  return value as number;
}

function query(endpoint: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) search.set(key, String(value));
  return `${endpoint}?${search.toString()}`;
}

async function api(sessionId: string, endpoint: string, init: RequestInit = {}): Promise<ApiEnvelope> {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      accept: 'application/json',
      cookie: `qc-session-id=${sessionId}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let payload: ApiEnvelope;
  try {
    payload = JSON.parse(text) as ApiEnvelope;
  } catch {
    throw new Error(`${endpoint} 未返回有效 JSON；HTTP ${response.status}`);
  }
  if (!response.ok || payload.status !== 200 || payload.level === 'error') {
    throw new Error(`API 请求失败（${response.status}/${payload.status}）：${payload.msg ?? payload.info ?? '未知错误'}`);
  }
  return payload;
}

function localTime(value: string): string {
  const plain = /T(\d{2}):(\d{2})/.exec(value);
  if (plain && !/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) return `${plain[1]}:${plain[2]}`;
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) throw new Error(`无法解析课程时间：${value}`);
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(instant);
}

function minutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`无法解析时间：${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

async function fetchSchedules(sessionId: string, date: string): Promise<RecordValue[]> {
  const payload = await api(sessionId, query('/api/corp/company/supermonkey/schedules/', {
    order_by: 'start', from_date: date, to_date: date, show_all: 1, gym_id: GYM_ID, qc_corpid: CORP_ID,
  }));
  const data = asRecord(payload.data, '课程响应缺少 data');
  return asArray(data.schedules, '课程响应缺少 schedules').map((item) => asRecord(item, '课程项无效'));
}

async function fetchOnlineCost(sessionId: string, scheduleId: string): Promise<number> {
  const payload = await api(sessionId, query('/api/corp/company/subsidy/available/', {
    supermonkey_schedule_id: scheduleId, qc_corpid: CORP_ID,
  }));
  return integerField(asRecord(payload.data, '补贴响应缺少 data'), 'employee_payment');
}

async function fetchGeneralCardId(sessionId: string, date: string): Promise<number> {
  const payload = await api(sessionId, query('/api/saas/user/general/cards/', { date, app_key: APP_KEY }));
  const cards = asArray(asRecord(payload.data, '卡响应缺少 data').corp_cards, '卡响应缺少 corp_cards')
    .map((item) => asRecord(item, '卡项无效'));
  const card = cards.find((item) => !stringField(item, 'disable_reason') && Number.isInteger(item.general_card_id));
  if (!card) throw new Error('没有可用于企业补贴的通用卡');
  return integerField(card, 'general_card_id');
}

async function preflight(sessionId: string, scheduleId: string): Promise<number> {
  const [cost] = await Promise.all([
    fetchOnlineCost(sessionId, scheduleId),
    api(sessionId, query('/api/mini_program_c/supermonkey/dialog/query/', { schedule_id: scheduleId, biz_type: 1 })),
  ]);
  return cost;
}

async function availableCourses(sessionId: string, date: string): Promise<Course[]> {
  const schedules = await fetchSchedules(sessionId, date);
  const matching = schedules.filter((schedule) => {
    const start = localTime(stringField(schedule, 'start'));
    return minutes(start) >= START_MINUTES && minutes(start) <= END_MINUTES
      && schedule.has_schedule_order !== true && schedule.supermonkey_status === 0;
  });
  return Promise.all(matching.map(async (schedule) => {
    const course = asRecord(schedule.course, '课程缺少 course');
    const coaches = Array.isArray(schedule.coaches) ? schedule.coaches.map((item) => asRecord(item)) : [];
    const scheduleId = stringField(schedule, 'id');
    if (!scheduleId) throw new Error('课程缺少 schedule id');
    return {
      scheduleId,
      className: stringField(course, 'name', '未命名课程'),
      coachName: coaches.map((coach) => stringField(coach, 'name') || stringField(coach, 'username')).filter(Boolean).join('、'),
      startTime: localTime(stringField(schedule, 'start')),
      endTime: localTime(stringField(schedule, 'end')),
      onlineCost: await fetchOnlineCost(sessionId, scheduleId),
    };
  }));
}

function durationMs(value: string): number {
  const match = /^(\d+)([smh])$/.exec(value);
  if (!match) throw new Error('--confirmation-timeout 格式应类似 30m、60s 或 1h');
  return Number(match[1]) * ({ s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as 's' | 'm' | 'h']);
}

async function waitForSelection(requestId: string, timeout: string): Promise<string | null> {
  const result = await waitForChoice(requestId, durationMs(timeout));
  if (result.status === 'rejected') return null;
  const payload = result.decision?.payload;
  if (result.status === 'selected' && payload && typeof payload === 'object'
    && 'scheduleId' in payload && typeof payload.scheduleId === 'string') return payload.scheduleId;
  throw new Error('回调缺少有效的课程选择');
}

function findPaymentUrl(value: unknown): string | undefined {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findPaymentUrl(item); if (found) return found; }
  } else if (value && typeof value === 'object') {
    const record = value as RecordValue;
    for (const key of ['alipay_url', 'pay_url', 'payment_url', 'url', 'qr_code']) {
      const found = findPaymentUrl(record[key]);
      if (found) return found;
    }
    for (const child of Object.values(record)) { const found = findPaymentUrl(child); if (found) return found; }
  }
  return undefined;
}

async function main(): Promise<void> {
  const { date, sessionId, timeout, dryRun } = parseArgs(process.argv.slice(2));
  const courses = await availableCourses(sessionId, date);
  if (courses.length === 0) {
    if (!dryRun) {
      await sendMessage(`${date} ${GYM_NAME} 18:30–21:00 暂无可预约课程。`);
    }
    process.stdout.write(`${JSON.stringify({ date, courses: [], sent: !dryRun }, null, 2)}\n`);
    return;
  }
  if (courses.length > 10) throw new Error('符合条件的课程超过 10 门，无法生成单张选择卡片');
  const cardCourses = courses.map((course) => ({
    scheduleId: course.scheduleId, className: course.className, coachName: course.coachName,
    startTime: course.startTime, endTime: course.endTime, onlineCost: course.onlineCost,
  }));
  if (dryRun) {
    process.stdout.write(`${JSON.stringify({ dry_run: true, date, recipient: RECIPIENT_EMAIL, courses: cardCourses }, null, 2)}\n`);
    return;
  }
  const sent = await sendConfirmation({
    title: '超级猩猩 · 选择课程',
    summary: `${date} · ${GYM_NAME}\n选择课程后将创建支付宝待支付订单，由你完成付款。\n\n` + courses.map(course =>
      `**${course.className}**\n${course.startTime}–${course.endTime} · ${course.coachName} · 个人支付 ${(course.onlineCost / 100).toFixed(2)} 元`).join('\n\n'),
    expiresAt: new Date(Date.now() + durationMs(timeout)).toISOString(),
    context: { workflow: 'supermonkey-course-selection', date, courses: cardCourses },
    options: [
      ...courses.map((course, index) => ({ id: `course_${index}`, label: `${course.startTime} ${course.className}`,
        result: 'selected' as const, payload: { scheduleId: course.scheduleId } })),
      { id: 'reject', label: '取消预订', result: 'rejected' as const, type: 'danger' as const },
    ],
  });
  const selectedScheduleId = await waitForSelection(sent.requestId, timeout);
  if (!selectedScheduleId) {
    process.stdout.write(`${JSON.stringify({ cancelled: true, date, message_id: sent.messageId }, null, 2)}\n`);
    return;
  }
  if (!courses.some((course) => course.scheduleId === selectedScheduleId)) throw new Error('回调中的课程不属于本次列表');

  const refreshed = await availableCourses(sessionId, date);
  const selected = refreshed.find((course) => course.scheduleId === selectedScheduleId);
  if (!selected) throw new Error('所选课程已不可预约，未创建订单');
  const [onlineCost, generalCardId] = await Promise.all([
    preflight(sessionId, selectedScheduleId), fetchGeneralCardId(sessionId, date),
  ]);
  const approved = courses.find(course => course.scheduleId === selectedScheduleId)!;
  if (onlineCost !== approved.onlineCost || selected.startTime !== approved.startTime
    || selected.endTime !== approved.endTime || selected.className !== approved.className) {
    throw new Error('课程或费用已变化，需要重新确认，未创建订单');
  }
  const order = await api(sessionId, '/api/corp/company/supermonkey/order/', {
    method: 'POST',
    body: JSON.stringify({
      general_card_id: generalCardId,
      sub_channel: 'ALIPAY_QRCODE',
      online_cost: onlineCost,
      schedule_id: selectedScheduleId,
    }),
  });
  const paymentUrl = findPaymentUrl(order.data);
  if (!paymentUrl) throw new Error('订单已创建，但响应中没有找到 HTTP(S) 支付链接');
  await sendMessage(`${selected.className}（${date} ${selected.startTime}–${selected.endTime}）支付宝待支付订单已创建：[打开支付链接](${paymentUrl})`);
  process.stdout.write(`${JSON.stringify({
    created: true, date, schedule_id: selectedScheduleId, class_name: selected.className,
    online_cost: onlineCost, recipient: RECIPIENT_EMAIL, payment_url: paymentUrl,
  }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`错误：${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
