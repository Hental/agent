#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const TIME_ZONE = 'Asia/Shanghai';
const OFFSET = '+08:00';
// 预约课日程的标题是课程名（如「燃脂搏击 BODYCOMBAT」），门店名在地点字段 location.name。
const STORE_NAME = '超级猩猩（天府三街全能店）';
// 兼容旧输出字段名。
const TITLE = STORE_NAME;
const DEFAULT_ORIGIN = '桂溪广场 C 栋夜间上车点';
const RULES = [
  { start: '18:40', end: '20:40', origin: '桂溪广场 C 栋夜间上车点' },
  { start: '19:50', end: '20:50', origin: '肯德基（海洋中心店）' },
];
const CLI_TIMEOUT_MS = 60_000;

function usage() {
  return `用法：node scripts/check_calendar.mjs [--date YYYY-MM-DD] [--lark-cli 路径]

以用户身份拉取指定日期（默认 Asia/Shanghai 当天）主日历的全天日程（+agenda），
按地点名称「${STORE_NAME}」匹配未取消的课程日程并按起止时间判定起点，输出 JSON：
  matched   命中一条时间规则，origin 为对应起点
  no_match  没有命中，origin 为默认起点
  conflict  两条时间规则同时命中，必须由用户确认起点

该脚本只检查日程，不会配置或提交企业打车订单。`;
}

function parseArgs(args) {
  const options = { date: null, larkCli: process.env.LARK_CLI?.trim() || 'lark-cli' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') return { ...options, help: true };
    if (arg === '--date') options.date = args[++index];
    else if (arg === '--lark-cli') options.larkCli = args[++index];
    else throw new Error(`未知参数：${arg}`);
  }
  if (!options.larkCli) throw new Error('--lark-cli 缺少路径');
  return options;
}

function datePartsInTimeZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function todayInTimeZone() {
  const { year, month, day } = datePartsInTimeZone();
  return `${year}-${month}-${day}`;
}

function validateDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) throw new Error('--date 必须是 YYYY-MM-DD');
  const [, year, month, day] = match;
  const probe = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    probe.getUTCFullYear() !== Number(year)
    || probe.getUTCMonth() + 1 !== Number(month)
    || probe.getUTCDate() !== Number(day)
  ) throw new Error(`无效日期：${value}`);
  return value;
}

function nextDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return [next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()]
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
    .join('-');
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}没有返回有效 JSON`);
  }
}

// 用 +agenda 拉取单天全天日程：返回扁平事件数组（含 location 字段），单天查询不涉及分页。
function fetchAgenda({ date, larkCli }) {
  const args = [
    'calendar', '+agenda',
    '--as', 'user',
    '--start', `${date}T00:00:00${OFFSET}`,
    '--end', `${nextDate(date)}T00:00:00${OFFSET}`,
    '--json',
  ];

  const result = spawnSync(larkCli, args, {
    encoding: 'utf8',
    timeout: CLI_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    env: {
      ...process.env,
      LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
      LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
    },
  });
  if (result.error) {
    const reason = result.error.code === 'ETIMEDOUT'
      ? `lark-cli 超过 ${CLI_TIMEOUT_MS / 1000}s 未响应`
      : result.error.message;
    throw new Error(`无法执行 lark-cli：${reason}`);
  }

  const output = (result.stdout || result.stderr || '').trim();
  const envelope = parseJson(output, 'lark-cli');
  if (result.status !== 0 || envelope.ok !== true) {
    const error = envelope.error ?? {};
    throw new Error(error.hint || error.message || `lark-cli 退出码 ${result.status}`);
  }
  if (!Array.isArray(envelope.data)) throw new Error('lark-cli +agenda 未返回事件数组');
  return envelope.data;
}

function isCancelled(event) {
  const status = String(event.status ?? event.event_status ?? event.eventStatus ?? '').toLowerCase();
  return status === 'cancelled' || status === 'canceled'
    || event.is_cancelled === true || event.is_canceled === true;
}

function rawEventTime(event, side) {
  if (side === 'start') return event.start_time ?? event.startTime ?? event.start;
  return event.end_time ?? event.endTime ?? event.end;
}

function valueToDate(value) {
  const raw = value && typeof value === 'object'
    ? value.timestamp ?? value.date_time ?? value.dateTime ?? value.datetime ?? value.value
    : value;
  if (raw === undefined || raw === null) return null;
  if (/^\d{10,13}$/.test(String(raw))) {
    const number = Number(raw);
    return new Date(String(raw).length === 10 ? number * 1000 : number);
  }
  if (typeof raw === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function localDateTime(value) {
  const instant = valueToDate(value);
  if (instant) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(instant);
    const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
    return { date: `${fields.year}-${fields.month}-${fields.day}`, time: `${fields.hour}:${fields.minute}` };
  }

  const raw = value && typeof value === 'object'
    ? value.date_time ?? value.dateTime ?? value.datetime ?? value.value
    : value;
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(String(raw ?? ''));
  return match ? { date: match[1], time: match[2] } : null;
}

function eventLocationName(event) {
  const location = event.location;
  if (location && typeof location === 'object') {
    return location.name ?? location.title ?? null;
  }
  return null;
}

function normalizeEvent(event) {
  const start = localDateTime(rawEventTime(event, 'start'));
  const end = localDateTime(rawEventTime(event, 'end'));
  return {
    eventId: event.event_id ?? event.eventId ?? event.id ?? null,
    summary: event.summary ?? event.title ?? '',
    locationName: eventLocationName(event),
    start,
    end,
    cancelled: isCancelled(event),
  };
}

function decide(date, events) {
  const candidates = events
    .map(normalizeEvent)
    .filter((event) => !event.cancelled && event.locationName === STORE_NAME)
    .filter((event) => event.start?.date === date && event.end?.date === date);

  const matches = RULES.flatMap((rule) => candidates
    .filter((event) => event.start.time === rule.start && event.end.time === rule.end)
    .map((event) => ({ ...rule, eventId: event.eventId, summary: event.summary })));
  const matchedRules = [...new Set(matches.map(({ start, end }) => `${start}-${end}`))];

  if (matchedRules.length > 1) {
    return { decision: 'conflict', origin: null, matches };
  }
  if (matches.length > 0) {
    return { decision: 'matched', origin: matches[0].origin, matches };
  }
  return { decision: 'no_match', origin: DEFAULT_ORIGIN, matches: [] };
}

function printFailure(error) {
  console.error(JSON.stringify({
    ok: false,
    checkedAt: new Date().toISOString(),
    timeZone: TIME_ZONE,
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exitCode = 1;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const date = validateDate(options.date ?? todayInTimeZone());
    const events = fetchAgenda({ date, larkCli: options.larkCli });

    const result = decide(date, events);
    console.log(JSON.stringify({
      ok: result.decision !== 'conflict',
      checkedAt: new Date().toISOString(),
      date,
      timeZone: TIME_ZONE,
      title: TITLE,
      ...result,
    }));
    if (result.decision === 'conflict') process.exitCode = 2;
  }
} catch (error) {
  printFailure(error);
}
