#!/usr/bin/env node
import { Client, ClientError, DEFAULT_PROFILE, captureProfile, dumps, emit, loadProfile } from './client';
import { UsageError, parseOptions, globalOptions, commandOptions, decimal, positive, choice } from './args';

function help(command = ''): void {
  console.log(`Usage: doubao-work [global options] ${command || '<command> [options]'}

Global options (before command):
  --profile <path>             Login profile
  --timeout <seconds>          Request deadline (default: 180)
  --output-format <format>     json, text, stream-json (default: json)
  -p, --prompt <text>          Create a session and exit
  --session <id>               Continue a session with root -p
  -h, --help                  Show help

Commands:
  auth capture [--request-id ID] [--completion-id ID]
  auth status
  sessions list [--limit N] [--cursor N] [--pin-query-type 0|1] [--all] [--search TEXT]
  sessions get ID
  sessions messages ID [--limit N] [--anchor N] [--direction 1|2] [--all]
  sessions create -p TEXT [--title TITLE]
  sessions send ID -p TEXT
  sessions rename ID TITLE
  sessions delete ID --yes

'session' is an alias for 'sessions'. Use -- before positional values starting with '-'.
For option values starting with '-', use --prompt=VALUE.`);
}

async function main(): Promise<void> {
  const root = parseOptions(process.argv.slice(2), globalOptions, true);
  const global = root.options;
  const profilePath = String(global.profile ?? DEFAULT_PROFILE);
  const timeout = positive(String(global.timeout ?? '180'));
  const format = choice(String(global['output-format'] ?? 'json'), ['json', 'text', 'stream-json']);
  if (global.help) { help(); return; }
  if (global.session !== undefined && global.prompt === undefined) throw new UsageError('--session requires -p');
  const finish = (result: any) => {
    if (format === 'text' && typeof result.text === 'string') {
      console.log(result.text); console.error(`session_id=${result.session_id}`);
    } else emit(format === 'stream-json' ? { type: 'result', ...result } : result);
  };
  const makeClient = async () => new Client(await loadProfile(profilePath), timeout);
  if (!root.rest.length) {
    if (global.prompt === undefined) { help(); return; }
    const session = global.session === undefined ? undefined : decimal(String(global.session));
    finish(await (await makeClient()).send(String(global.prompt), session, format === 'stream-json'));
    return;
  }
  if (global.prompt !== undefined) throw new UsageError('Use either root -p or a subcommand.');
  const [groupRaw, action, ...tokens] = root.rest;
  const group = groupRaw === 'session' ? 'sessions' : groupRaw;
  if ((group === 'sessions' || group === 'auth') && (!action || action === '--help' || action === '-h')) {
    if (tokens.length) throw new UsageError('Unexpected arguments after help');
    help(group); return;
  }
  const command = `${group} ${action}`;
  const allowed = commandOptions[command];
  if (!allowed) throw new UsageError(`Unknown command: ${command}`);
  const { options: opts, rest: args } = parseOptions(tokens, allowed);
  if (opts.help) { help(command); return; }
  const arity = ['get', 'messages', 'send', 'delete'].includes(action!) ? 1 : action === 'rename' ? 2 : 0;
  if (args.length !== arity) throw new UsageError(`${command} expects ${arity} positional arguments`);
  const id = arity ? decimal(args[0]!) : '';
  if (['create', 'send'].includes(action!) && opts.prompt === undefined) throw new UsageError('--prompt is required');
  if (action === 'delete' && opts.yes !== true) throw new UsageError('--yes is required');
  const limit = positive(String(opts.limit ?? '20'));
  const cursor = decimal(String(opts.cursor ?? '0'));
  const anchor = decimal(String(opts.anchor ?? '0'));
  const direction = Number(choice(String(opts.direction ?? '2'), ['1', '2']));
  const pin = opts['pin-query-type'] === undefined ? undefined : Number(choice(String(opts['pin-query-type']), ['0', '1']));
  if (command === 'auth capture') {
    finish(await captureProfile(profilePath, opts['request-id'] as string | undefined, opts['completion-id'] as string | undefined));
    return;
  }
  const client = await makeClient();
  switch (command) {
    case 'auth status':
      await client.listPage(1);
      finish({ ok: true, authenticated: true, captured_at: client.profile.captured_at }); break;
    case 'sessions list': finish(await client.sessions(limit, cursor, opts.all === true, opts.search as string | undefined, pin)); break;
    case 'sessions get': finish(await client.info(id)); break;
    case 'sessions messages': finish(await client.history(id, limit, anchor, direction, opts.all === true)); break;
    case 'sessions rename': finish(await client.rename(id, args[1]!)); break;
    case 'sessions delete': finish(await client.delete(id)); break;
    case 'sessions send': finish(await client.send(String(opts.prompt), id, format === 'stream-json')); break;
    case 'sessions create': {
      const result = await client.send(String(opts.prompt), undefined, format === 'stream-json');
      if (opts.title) {
        try { await client.rename(result.session_id, String(opts.title)); }
        catch (error) {
          throw new ClientError(`Created session=${result.session_id}, but rename failed: ${error instanceof Error ? error.message : error}`);
        }
        result.name = String(opts.title);
      }
      finish(result); break;
    }
  }
}

try { await main(); }
catch (error) {
  if (error instanceof UsageError) {
    console.error(`doubao-work: error: ${error.message}`); process.exitCode = 2;
  } else {
    console.error(dumps({ ok: false, error: error instanceof ClientError ? error.message
      : 'Unsupported profile or API response shape; refresh capture and check client version.' }));
    process.exitCode = 1;
  }
}
