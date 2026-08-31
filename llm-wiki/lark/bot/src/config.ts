import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
dotenv.config({ path: envPath, quiet: true });

export interface AppConfig {
  appId: string;
  appSecret: string;
  autoReply: true;
  replyPrefix: '收到：';
  domainName: 'feishu';
  logLevel: 'info';
  host: string;
  port: number;
  eventStoreCapacity: number;
  processConcurrency: number;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量 ${name}，请在 lark/bot/.env 中配置`);
  return value;
}

function integerValue(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  range: { min: number; max: number },
): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    throw new Error(`${name} 必须是 ${range.min} 到 ${range.max} 之间的整数`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return Object.freeze({
    appId: required(env, 'LARK_BOT_ID'),
    appSecret: required(env, 'LARK_BOT_SK'),
    autoReply: true,
    replyPrefix: '收到：',
    domainName: 'feishu',
    logLevel: 'info',
    host: env.HOST?.trim() || '127.0.0.1',
    port: integerValue(env, 'PORT', 3000, { min: 1, max: 65_535 }),
    eventStoreCapacity: integerValue(env, 'EVENT_STORE_CAPACITY', 500, { min: 10, max: 10_000 }),
    processConcurrency: integerValue(env, 'PROCESS_CONCURRENCY', 2, { min: 1, max: 20 }),
  });
}
