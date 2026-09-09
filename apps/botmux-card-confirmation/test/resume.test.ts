import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequest } from '../src/request.js';
import { decide, readRequest, saveRequest } from '../src/state.js';
import { cancelResume, dispatchPending, runResume } from '../src/resume.js';
import { ACTION_NAME } from '../src/defaults.js';
import type { ConfirmationInput } from '../src/types.js';

function fixture(t: test.TestContext, resume = true) {
  const root = resolve(import.meta.dirname, '../../../.reports/botmux-card-confirmation-test');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, 'resume-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const request = createRequest({ summary: 'test', testOnly: true, expiresAt: new Date(Date.now() + 60000).toISOString(),
    ...(resume ? { actionHandling: { mode: 'resume' as const, agent: 'codex-cli' as const, threadId: randomUUID(), cwd: dir } } : {}),
  }, randomUUID());
  request.status = 'pending'; request.messageId = 'om_test';
  saveRequest(dir, request);
  const event = { schemaVersion: 1, actionName: ACTION_NAME, larkAppId: request.larkAppId,
    operator: { open_id: request.operatorId }, context: { open_chat_id: request.chatId, open_message_id: request.messageId },
    action: { value: { action: ACTION_NAME, requestId: request.id, nonce: request.nonce, optionId: 'reject' } },
  };
  return { dir, request, event };
}

test('local mode records action without dispatching', async t => {
  const { dir, request, event } = fixture(t, false);
  decide(dir, event);
  await dispatchPending(dir, async () => { throw new Error('must not run'); });
  assert.equal(readRequest(dir, request.id).resumeDelivery, undefined);
});

test('verified rejection queues once and dispatch claims survive concurrent/repeated callbacks', async t => {
  const { dir, request, event } = fixture(t);
  decide(dir, event);
  assert.equal(readRequest(dir, request.id).resumeDelivery?.status, 'queued');
  let calls = 0;
  await dispatchPending(dir, async (_request, prompt) => {
    calls++;
    assert.match(prompt, /testOnly/);
    assert.ok(prompt.includes(request.id));
    decide(dir, event);
    await dispatchPending(dir, async () => { calls++; return { status: 'completed' }; });
    return { status: 'completed' };
  });
  await dispatchPending(dir, async () => { calls++; return { status: 'completed' }; });
  assert.equal(calls, 1);
  assert.equal(readRequest(dir, request.id).status, 'rejected');
  assert.equal(readRequest(dir, request.id).resumeDelivery?.status, 'completed');
});

test('invalid callback never queues; cancellation before click remains cancelled', async t => {
  const { dir, request, event } = fixture(t);
  assert.throws(() => decide(dir, { ...event, larkAppId: 'bad' }));
  assert.equal(readRequest(dir, request.id).resumeDelivery, undefined);
  cancelResume(dir, request.id);
  decide(dir, event);
  let calls = 0;
  await dispatchPending(dir, async () => { calls++; return { status: 'completed' }; });
  assert.equal(calls, 0);
  assert.equal(readRequest(dir, request.id).decision?.value, 'reject');
});

test('ambiguous dispatch does not retry on another scan', async t => {
  const { dir, request, event } = fixture(t);
  decide(dir, event);
  await dispatchPending(dir, async () => { throw new Error('lost receipt'); });
  assert.equal(readRequest(dir, request.id).resumeDelivery?.status, 'unknown');
  let calls = 0;
  await dispatchPending(dir, async () => { calls++; return { status: 'completed' }; });
  assert.equal(calls, 0);
});

test('resume requires explicit supported agent, UUID and cwd; app requires socket', () => {
  const input = { summary: 'test', expiresAt: new Date(Date.now() + 60000).toISOString() };
  for (const binding of [ { mode: 'resume' }, { mode: 'resume', agent: 'other' },
    { mode: 'resume', agent: 'codex-cli', threadId: '--last', cwd: process.cwd() },
    { mode: 'resume', agent: 'codex-app', threadId: randomUUID(), cwd: process.cwd() },
    { mode: 'invalid' },
  ]) assert.throws(() => createRequest({ ...input, actionHandling: binding } as ConfirmationInput, randomUUID()));
});

test('CLI and App adapters exercise actual process transport without starting Codex', async t => {
  const { dir, request } = fixture(t);
  const executable = join(dir, 'mock-codex');
  writeFileSync(executable, `#!${process.execPath}
const readline = require('node:readline');
if (process.env.BOTMUX_PLUGIN_CARD_ACTION_TOKEN) process.exit(10);
if (process.argv[2] === 'exec') {
 if (process.argv[3] !== 'resume' || process.argv[5] !== ${JSON.stringify(request.actionHandling!.mode === 'resume' ? request.actionHandling!.threadId : '')}) process.exit(11);
 process.stdin.resume(); process.stdin.on('end', () => console.log(JSON.stringify({type:'turn.completed'})));
} else {
 const rl=readline.createInterface({input:process.stdin});
 rl.on('line', line => {
  const m=JSON.parse(line); if (!m.id) return;
  let result={};
  if(m.method==='thread/resume') result={thread:{id:m.params.threadId,status:{type:'idle'}},cwd:process.cwd()};
  if(m.method==='turn/start') result={turn:{id:'turn_mock'}};
  console.log(JSON.stringify({id:m.id,result}));
 });
}
`, { mode: 0o700 });
  const old = process.env.CARD_CODEX_BIN;
  process.env.CARD_CODEX_BIN = executable;
  t.after(() => { if (old === undefined) delete process.env.CARD_CODEX_BIN; else process.env.CARD_CODEX_BIN = old; });
  assert.deepEqual(await runResume(request, 'read local record'), { status: 'completed' });
  if (request.actionHandling?.mode !== 'resume') throw new Error('binding');
  request.actionHandling = { ...request.actionHandling, agent: 'codex-app', socketPath: join(dir, 'mock.sock') };
  assert.deepEqual(await runResume(request, 'read local record'), { status: 'started', turnId: 'turn_mock' });
  const mockSource = readFileSync(executable, 'utf8');
  writeFileSync(executable, mockSource.replace("type:'idle'", "type:'active'"));
  await assert.rejects(runResume(request, 'read local record'), /not idle/);
  writeFileSync(executable, mockSource.replace("result={turn:{id:'turn_mock'}}", "result={turn:{}}"));
  await assert.rejects(runResume(request, 'read local record'), /Missing turn receipt/);
});
