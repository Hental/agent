#!/usr/bin/env node
// Non-interactive Doubao Work conversation client (TypeScript entry point).
import { Command, CommanderError, InvalidArgumentError } from 'commander';
import {
  Client, ClientError, DEFAULT_PROFILE, captureProfile, dumps, emit, loadProfile,
} from './client';

function positiveArg(value: string): number {
  if (!/^\d+$/.test(value) || Number(value) < 1) throw new InvalidArgumentError('must be a positive integer');
  return Number(value);
}
function decimalArg(value: string): string {
  if (!/^\d+$/.test(value)) throw new InvalidArgumentError('must be a decimal string');
  return value;
}
function formatArg(value: string): string {
  if (!['json', 'text', 'stream-json'].includes(value)) {
    throw new InvalidArgumentError('must be one of: json, text, stream-json');
  }
  return value;
}
function choiceArg(choices: number[]): (value: string) => number {
  return (value: string) => {
    if (!choices.some((c) => String(c) === value)) {
      throw new InvalidArgumentError(`must be one of: ${choices.join(', ')}`);
    }
    return Number(value);
  };
}

const program = new Command();
program
  .name('doubao-work')
  .description('Non-interactive Doubao Work conversation client.')
  .option('--profile <path>', 'profile file path', DEFAULT_PROFILE)
  .option('--timeout <seconds>', 'request timeout in seconds', positiveArg, 180)
  .option('--output-format <format>', 'json, text or stream-json', formatArg, 'json')
  .option('-p, --prompt <prompt>', 'Create a session, or continue --session, and exit')
  .option('--session <id>', 'session to continue with -p', decimalArg)
  .enablePositionalOptions()
  .exitOverride();

function globals() {
  return program.opts<{ profile: string; timeout: number; outputFormat: string; prompt?: string; session?: string }>();
}

function usageError(message: string): never {
  console.error(`${program.name()}: error: ${message}`);
  process.exit(2);
}

async function makeClient(): Promise<Client> {
  const opts = globals();
  return new Client(await loadProfile(opts.profile), opts.timeout);
}

function finish(result: unknown): void {
  const format = globals().outputFormat;
  if (format === 'text' && result && typeof result === 'object' && 'text' in result) {
    const r = result as { text: string; session_id: string };
    console.log(r.text);
    console.error(`session_id=${r.session_id}`);
  } else {
    emit(format === 'stream-json' ? { type: 'result', ...(result as object) } : result);
  }
}

program.hook('preAction', (_root, command) => {
  const opts = globals();
  if (opts.session !== undefined && opts.prompt === undefined) usageError('--session requires -p');
  if (command !== program && opts.prompt !== undefined) usageError('Use either root -p or a subcommand.');
});

// Register the root action so Commander does not treat -p as a missing subcommand.
program.action(async () => {
  const opts = globals();
  if (opts.prompt === undefined) { program.outputHelp(); return; }
  const client = await makeClient();
  finish(await client.send(opts.prompt, opts.session, opts.outputFormat === 'stream-json'));
});

program
  .command('auth')
  .description('Capture login/runtime from Bifrost; no interactive login')
  .argument('<action>', 'capture or status', (value: string) => {
    if (!['capture', 'status'].includes(value)) throw new InvalidArgumentError('must be capture or status');
    return value;
  })
  .option('--request-id <id>', 'explicit Bifrost request id for the /im/ capture')
  .option('--completion-id <id>', 'explicit Bifrost request id for the /chat/completion capture')
  .action(async (action: string, opts: { requestId?: string; completionId?: string }) => {
    if (action === 'capture') {
      finish(await captureProfile(globals().profile, opts.requestId, opts.completionId));
      return;
    }
    const optsGlobal = globals();
    const profile = await loadProfile(optsGlobal.profile);
    const client = new Client(profile, optsGlobal.timeout);
    await client.listPage(1);
    finish({ ok: true, authenticated: true, captured_at: profile.captured_at });
  });

const sessions = program.command('sessions').alias('session').description('Manage conversations');

sessions
  .command('list')
  .description('List recent sessions, newest first')
  .option('--limit <n>', 'page size', positiveArg, 20)
  .option('--cursor <cursor>', 'pagination cursor from next_cursor', decimalArg, '0')
  .option('--pin-query-type <type>', 'pin group from next_pin_query_type', choiceArg([0, 1]))
  .option('--all', 'fetch all pages', false)
  .option('--search <text>', 'case-insensitive title filter over fetched pages')
  .action(async (opts: { limit: number; cursor: string; pinQueryType?: number; all: boolean; search?: string }) => {
    const client = await makeClient();
    finish(await client.sessions(opts.limit, opts.cursor, opts.all, opts.search, opts.pinQueryType));
  });

sessions
  .command('get')
  .description('Show one session')
  .argument('<id>', 'session id', decimalArg)
  .action(async (id: string) => finish(await (await makeClient()).info(id)));

sessions
  .command('messages')
  .description('Show session history')
  .argument('<id>', 'session id', decimalArg)
  .option('--limit <n>', 'page size', positiveArg, 20)
  .option('--anchor <index>', 'anchor index from next_index', decimalArg, '0')
  .option('--all', 'fetch all pages', false)
  .option('--direction <direction>', '1 forward, 2 backward', choiceArg([1, 2]), 2)
  .action(async (id: string, opts: { limit: number; anchor: string; all: boolean; direction: number }) => {
    const client = await makeClient();
    finish(await client.history(id, opts.limit, opts.anchor, opts.direction, opts.all));
  });

sessions
  .command('create')
  .description('Create a session from a first prompt')
  .requiredOption('-p, --prompt <prompt>', 'first prompt')
  .option('--title <title>', 'rename the session after creation')
  .action(async (opts: { prompt: string; title?: string }) => {
    const client = await makeClient();
    const result = await client.send(opts.prompt, undefined, globals().outputFormat === 'stream-json');
    if (opts.title) {
      try {
        await client.rename(result.session_id, opts.title);
      } catch (error) {
        throw new ClientError(`Created session=${result.session_id}, but rename failed: ${error instanceof Error ? error.message : error}`);
      }
      result.name = opts.title;
    }
    finish(result);
  });

sessions
  .command('send')
  .description('Continue an existing session')
  .argument('<id>', 'session id', decimalArg)
  .requiredOption('-p, --prompt <prompt>', 'prompt to send')
  .action(async (id: string, opts: { prompt: string }) => {
    const client = await makeClient();
    finish(await client.send(opts.prompt, id, globals().outputFormat === 'stream-json'));
  });

sessions
  .command('rename')
  .description('Rename a session')
  .argument('<id>', 'session id', decimalArg)
  .argument('<title>', 'new title')
  .action(async (id: string, title: string) => finish(await (await makeClient()).rename(id, title)));

sessions
  .command('delete')
  .description('Delete one session; requires --yes, no batch delete')
  .argument('<id>', 'session id', decimalArg)
  .option('--yes', 'explicitly delete this single session without a prompt', false)
  .action(async (id: string, opts: { yes: boolean }) => {
    if (!opts.yes) usageError('the following arguments are required: --yes');
    finish(await (await makeClient()).delete(id));
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      // commander already printed its message; argparse-style usage errors exit 2.
      process.exit(error.code === 'commander.helpDisplayed' ? 0 : 2);
    }
    const message = error instanceof ClientError
      ? error.message
      : 'Unsupported profile or API response shape; refresh capture and check client version.';
    console.error(dumps({ ok: false, error: message }));
    process.exit(1);
  }
}

await main();
