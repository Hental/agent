export type CliCommand =
  | { name: 'health'; baseUrl: string }
  | { name: 'events'; baseUrl: string; limit: number }
  | { name: 'card-actions'; baseUrl: string; requestId: string }
  | { name: 'process'; baseUrl: string; eventId: string }
  | {
      name: 'send';
      baseUrl: string;
      receiveId: string;
      receiveIdType: string;
      text: string;
    }
  | { name: 'send-card'; baseUrl: string; receiveId: string; receiveIdType: string }
  | {
      name: 'send-booking-card'; baseUrl: string; receiveId: string; receiveIdType: string;
      requestId: string; className: string; gymName: string; startTime: string; endTime: string; onlineCost: number;
    }
  | {
      name: 'send-course-list-card'; baseUrl: string; receiveId: string; receiveIdType: string;
      requestId: string; date: string; gymName: string; courses: unknown[];
    };

export const HELP = `用法: npm run cli -- <command> [options]

Commands:
  health
  send --receive-id <id> --text <text> [--receive-id-type chat_id|open_id|user_id|union_id|email]
  events [--limit <1-100>]
  card-actions --request-id <id>
  process <event-id>
  send-card --receive-id <id> [--receive-id-type chat_id|open_id|user_id|union_id|email]
  send-booking-card --email <email> --request-id <id> --class-name <text> --gym-name <text> --start-time <text> --end-time <text> --online-cost <fen>
  send-course-list-card --email <email> --request-id <id> --date <YYYY-MM-DD> --gym-name <text> --courses-json <json-array>

Global option:
  --base-url <url>  Hono 服务地址，默认读取 LARK_BOT_URL 或 http://127.0.0.1:3000`;

function parseOptions(args: string[]): { options: Record<string, string>; positional: string[] } {
  const options: Record<string, string> = {};
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith('--')) {
      if (arg) positional.push(arg);
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`参数 ${arg} 缺少值`);
    options[arg.slice(2)] = value;
    index += 1;
  }
  return { options, positional };
}

function required(options: Record<string, string>, name: string): string {
  const value = options[name]?.trim();
  if (!value) throw new Error(`缺少参数 --${name}`);
  return value;
}

export function parseCliArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): CliCommand {
  const [name, ...rest] = argv;
  if (!name || name === 'help' || name === '--help' || name === '-h') throw new Error(HELP);
  const { options, positional } = parseOptions(rest);
  const baseUrl = (options['base-url'] || env.LARK_BOT_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

  if (name === 'health') return { name, baseUrl };
  if (name === 'events') {
    const limit = Number(options.limit || '50');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('--limit 必须是 1 到 100 之间的整数');
    }
    return { name, baseUrl, limit };
  }
  if (name === 'card-actions') return { name, baseUrl, requestId: required(options, 'request-id') };
  if (name === 'process') {
    const eventId = positional[0]?.trim();
    if (!eventId) throw new Error('process 需要 event-id');
    return { name, baseUrl, eventId };
  }
  if (name === 'send') {
    return {
      name,
      baseUrl,
      receiveId: required(options, 'receive-id'),
      receiveIdType: options['receive-id-type'] || 'chat_id',
      text: required(options, 'text'),
    };
  }
  if (name === 'send-card') {
    const email = options.email?.trim();
    return {
      name,
      baseUrl,
      receiveId: email || required(options, 'receive-id'),
      receiveIdType: email ? 'email' : options['receive-id-type'] || 'chat_id',
    };
  }
  if (name === 'send-booking-card') {
    const email = options.email?.trim();
    const onlineCost = Number(required(options, 'online-cost'));
    if (!Number.isInteger(onlineCost) || onlineCost < 0) throw new Error('--online-cost 必须是非负整数');
    return {
      name, baseUrl,
      receiveId: email || required(options, 'receive-id'),
      receiveIdType: email ? 'email' : options['receive-id-type'] || 'chat_id',
      requestId: required(options, 'request-id'),
      className: required(options, 'class-name'),
      gymName: required(options, 'gym-name'),
      startTime: required(options, 'start-time'),
      endTime: required(options, 'end-time'),
      onlineCost,
    };
  }
  if (name === 'send-course-list-card') {
    const email = options.email?.trim();
    let courses: unknown;
    try {
      courses = JSON.parse(required(options, 'courses-json')) as unknown;
    } catch {
      throw new Error('--courses-json 必须是有效 JSON');
    }
    if (!Array.isArray(courses)) throw new Error('--courses-json 必须是 JSON 数组');
    return {
      name, baseUrl,
      receiveId: email || required(options, 'receive-id'),
      receiveIdType: email ? 'email' : options['receive-id-type'] || 'chat_id',
      requestId: required(options, 'request-id'),
      date: required(options, 'date'),
      gymName: required(options, 'gym-name'),
      courses,
    };
  }
  throw new Error(`未知命令: ${name}\n\n${HELP}`);
}
