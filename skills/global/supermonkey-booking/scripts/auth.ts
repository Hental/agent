#!/usr/bin/env -S npx tsx

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

type RecordValue = Record<string, unknown>;
type OutputFormat = 'raw' | 'export';

interface Options {
  latest: string;
  limit: number;
  format: OutputFormat;
}

const DOMAIN = 'yql.qingchengfit.cn';
const COOKIE_NAME = 'qc-session-id';
const execFileAsync = promisify(execFile);

function usage(): string {
  return [
    '用法: npx tsx scripts/auth.ts [--latest 10m] [--limit 50] [--format raw|export]',
    '',
    '从 Bifrost 最近捕获的青橙请求头中提取 qc-session-id。',
    '默认仅向 stdout 输出会话值，便于注入当前 shell：',
    '  export QINGCHENG_SESSION_ID="$(npm run -s auth)"',
  ].join('\n');
}

function parseArgs(argv: string[]): Options {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith('--')) throw new Error(`无法识别的参数：${token}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${token} 缺少值`);
    values.set(token.slice(2), value);
    index += 1;
  }

  for (const name of values.keys()) {
    if (!['latest', 'limit', 'format'].includes(name)) throw new Error(`无法识别的参数：--${name}`);
  }

  const latest = values.get('latest') ?? '10m';
  if (!/^[1-9]\d*(?:s|m|h|d)$/.test(latest)) {
    throw new Error('--latest 格式应类似 30s、10m、2h 或 1d');
  }

  const limitText = values.get('limit') ?? '50';
  const limit = Number(limitText);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('--limit 必须是 1–100 的整数');
  }

  const format = values.get('format') ?? 'raw';
  if (format !== 'raw' && format !== 'export') {
    throw new Error('--format 只能是 raw 或 export');
  }

  return { latest, limit, format };
}

function asRecord(value: unknown): RecordValue | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as RecordValue
    : undefined;
}

async function bifrost(args: string[]): Promise<unknown> {
  const binary = process.env.BIFROST_BIN ?? 'bifrost';
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(binary, args, {
      env: process.env,
      maxBuffer: 8 * 1024 * 1024,
      encoding: 'utf8',
    }));
  } catch {
    throw new Error(`Bifrost 命令执行失败：${binary} ${args[0] ?? ''}`.trim());
  }

  try {
    return JSON.parse(stdout) as unknown;
  } catch {
    throw new Error(`Bifrost ${args[0] ?? '命令'} 未返回有效 JSON`);
  }
}

function headerPairs(value: unknown): Array<[string, string]> {
  if (Array.isArray(value)) {
    const pairs: Array<[string, string]> = [];
    for (const item of value) {
      if (Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'string') {
        pairs.push([item[0], item[1]]);
        continue;
      }
      const record = asRecord(item);
      if (!record) continue;
      const name = record.name ?? record.key;
      const headerValue = record.value;
      if (typeof name === 'string' && typeof headerValue === 'string') pairs.push([name, headerValue]);
    }
    return pairs;
  }

  const record = asRecord(value);
  if (!record) return [];
  return Object.entries(record).flatMap(([name, headerValue]) => {
    if (typeof headerValue === 'string') return [[name, headerValue] as [string, string]];
    if (Array.isArray(headerValue)) {
      return headerValue
        .filter((item): item is string => typeof item === 'string')
        .map((item): [string, string] => [name, item]);
    }
    return [];
  });
}

function requestHeaders(record: RecordValue): Array<[string, string]> {
  const nested = headerPairs(asRecord(record.headers)?.request);
  if (nested.length > 0) return nested;
  for (const key of ['request_headers', 'req_headers', 'requestHeaders']) {
    const pairs = headerPairs(record[key]);
    if (pairs.length > 0) return pairs;
  }
  return [];
}

function sessionFromCookie(cookie: string): string | undefined {
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    if (value && !/[;\r\n\s]/.test(value)) return value;
  }
  return undefined;
}

function findSession(payload: unknown): string | undefined {
  const root = asRecord(payload);
  const results = Array.isArray(root?.results) ? root.results : Array.isArray(payload) ? payload : [];
  for (const item of results) {
    const record = asRecord(item);
    if (!record) continue;
    for (const [name, value] of requestHeaders(record)) {
      if (name.toLowerCase() !== 'cookie') continue;
      const session = sessionFromCookie(value);
      if (session) return session;
    }
  }
  return undefined;
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const status = asRecord(await bifrost(['status', '--format', 'json']));
  if (status?.running !== true) throw new Error('Bifrost 代理未运行，请先执行 bifrost start');

  const payload = await bifrost([
    'search', COOKIE_NAME,
    '--domain', DOMAIN,
    '--req-header',
    '--status', '2xx',
    '--latest', options.latest,
    '--include', 'req-headers',
    '--max-results', String(options.limit),
    '--format', 'json',
  ]);
  const session = findSession(payload);
  if (!session) {
    throw new Error(`最近 ${options.latest} 内未找到 ${COOKIE_NAME}；请在飞书“字节健康 → 合作健身房”刷新页面后重试`);
  }

  const output = options.format === 'export'
    ? `export QINGCHENG_SESSION_ID=${shellQuote(session)}`
    : session;
  process.stdout.write(`${output}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '未知错误';
  process.stderr.write(`获取登录态失败：${message}\n`);
  process.exitCode = 1;
});
