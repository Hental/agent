import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '../src/client.js';
import { saveRequest, readRequest, decide } from '../src/state.js';
import { acquireRequestLock } from '../src/lock.js';
import { createRequest } from '../src/request.js';
import { ACTION_NAME, DEFAULT_TARGET } from '../src/defaults.js';
import type { CardActionEvent, ConfirmationRequest } from '../src/types.js';

const appDir = resolve(import.meta.dirname, '..');
const fixtureRoot = resolve(appDir, '../../.reports/botmux-card-confirmation-test');
const sessionId = randomUUID();
function emptyDirectory(t: test.TestContext) {
  mkdirSync(fixtureRoot, { recursive: true });
  const directory = mkdtempSync(`${fixtureRoot}/race-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function fixture(t: test.TestContext) {
  const directory = emptyDirectory(t);
  const request: ConfirmationRequest = {
    ...createRequest({ summary: 'Race test', testOnly: true, expiresAt: new Date(Date.now() + 60000).toISOString() }, sessionId),
    status: 'pending', messageId: 'om_race',
  };
  saveRequest(directory, request);
  const event = (optionId: string): CardActionEvent => ({
    schemaVersion: 1, actionName: ACTION_NAME, larkAppId: request.larkAppId, eventId: 'race-event',
    operator: { open_id: request.operatorId },
    context: { open_chat_id: request.chatId, open_message_id: request.messageId! },
    action: { value: { action: ACTION_NAME, requestId: request.id, nonce: request.nonce, optionId } },
  });
  return { directory, request, event };
}
interface ChildResult { ok: boolean; status?: string; repeated?: boolean; error?: string }
function runChild(t: test.TestContext, input: {
  directory: string; id: string; event: CardActionEvent; operation: 'decide' | 'invalidate';
  timeoutMs?: number; contended?: string; readMarker?: string; continueMarker?: string;
}) {
  const child = spawn(process.execPath, ['--import', 'tsx', resolve(import.meta.dirname, 'race-child.ts'), JSON.stringify(input)],
    { cwd: appDir, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 6000);
  const done = new Promise<{ code: number | null; result: ChildResult }>((ok, fail) => {
    child.once('error', fail);
    child.once('close', code => {
      clearTimeout(timer);
      try { ok({ code, result: JSON.parse(stdout.trim()) as ChildResult }); }
      catch { fail(new Error(`Child failed (${code}): ${stderr || stdout}`)); }
    });
  });
  // Cleanup also covers an assertion failing before the child is awaited.
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    await done.catch(() => {});
    clearTimeout(timer);
  });
  return done;
}
async function waitFor(path: string) {
  const deadline = Date.now() + 4000;
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`Scheduling marker not reached: ${path}`);
    await delay(5);
  }
}

test('competing confirm and reject processes record exactly one first decision', async t => {
  const { directory, request, event } = fixture(t);
  const lock = acquireRequestLock(directory, request.id);
  const markers = ['confirm-waiting', 'reject-waiting'].map(name => resolve(directory, name));
  const children = ['confirm', 'reject'].map((choice, i) => runChild(t, {
    directory, id: request.id, event: event(choice), operation: 'decide', timeoutMs: 5000, contended: markers[i]!,
  }));
  try { await Promise.all(markers.map(waitFor)); } finally { lock.release(); }
  const results = await Promise.all(children);
  for (const child of results) assert.equal(child.code, 0);
  const winners = results.filter(child => child.result.repeated === false);
  assert.equal(winners.length, 1);
  assert.equal(results.filter(child => child.result.repeated === true).length, 1);
  const final = readRequest(directory, request.id);
  assert.equal(final.status, winners[0]!.result.status);
  assert.equal(final.decision?.value, final.status === 'confirmed' ? 'confirm' : 'reject');
});

for (const first of ['invalidate', 'decide'] as const) {
  test(`${first} keeps its terminal state when another process contends after its read`, async t => {
    const { directory, request, event } = fixture(t);
    const readMarker = resolve(directory, 'first-read');
    const continueMarker = resolve(directory, 'continue');
    const contended = resolve(directory, 'second-waiting');
    const one = runChild(t, { directory, id: request.id, event: event('confirm'), operation: first,
      timeoutMs: 5000, readMarker, continueMarker });
    await waitFor(readMarker);
    const two = runChild(t, { directory, id: request.id, event: event('confirm'),
      operation: first === 'decide' ? 'invalidate' : 'decide', timeoutMs: 5000, contended });
    try { await waitFor(contended); } finally { writeFileSync(continueMarker, 'continue'); }
    const results = await Promise.all([one, two]);
    for (const result of results) assert.equal(result.code, 0);
    const final = readRequest(directory, request.id);
    assert.equal(final.status, first === 'decide' ? 'confirmed' : 'invalidated');
    assert.equal(final.decision?.value, first === 'decide' ? 'confirm' : undefined);
    assert.equal(results[1]!.result.status, final.status);
  });
}

test('lock contention fails closed, preserves the owner, and permits retry after release', async t => {
  const { directory, request, event } = fixture(t);
  const lock = acquireRequestLock(directory, request.id);
  try {
    const child = await runChild(t, { directory, id: request.id, event: event('confirm'), operation: 'decide', timeoutMs: 100 });
    assert.equal(child.code, 2);
    assert.match(child.result.error ?? '', /locked by another process/);
    assert.equal(readRequest(directory, request.id).status, 'pending');
    assert.ok(existsSync(resolve(directory, request.id, 'request.lock')));
  } finally { lock.release(); }
  assert.equal(decide(directory, event('confirm')).request.status, 'confirmed');
});

test('release never deletes a lock with a different owner token', t => {
  const { directory, request } = fixture(t);
  const lock = acquireRequestLock(directory, request.id);
  const ownerPath = resolve(directory, request.id, 'request.lock/owner.json');
  writeFileSync(ownerPath, JSON.stringify({ token: 'different-owner', pid: 1 }));
  lock.release();
  assert.equal(JSON.parse(readFileSync(ownerPath, 'utf8')).token, 'different-owner');
});

for (const fail of [false, true]) {
  test(`send ${fail ? 'failure' : 'success'} cannot revive a concurrently invalidated request`, async t => {
    const directory = emptyDirectory(t);
    let id = '';
    const client = createClient({ directory, checkService: async () => {}, run: async args => {
      if (args[0] === 'history') return { sessionId, chatId: DEFAULT_TARGET.chatId };
      assert.equal(args[0], 'send');
      const cardPath = args[args.indexOf('--card-file') + 1]!;
      const card = JSON.parse(readFileSync(cardPath, 'utf8'));
      id = card.body.elements.find((element: { tag: string }) => element.tag === 'column_set')
        .columns[0].elements[0].behaviors[0].value.requestId;
      const invalidated = await client.invalidate(id);
      assert.equal(invalidated.status, 'invalidated');
      if (fail) throw new Error('isolated simulated timeout');
      return { success: true, sessionId, messageId: 'om_race_bound' };
    } });
    const sending = client.sendConfirmation({ summary: 'Send race', testOnly: true,
      expiresAt: new Date(Date.now() + 60000).toISOString() }, sessionId);
    if (fail) await assert.rejects(sending, /Send result unknown/);
    else assert.equal((await sending).success, true);
    const final = readRequest(directory, id);
    assert.equal(final.status, 'invalidated');
    assert.equal(final.messageId, fail ? null : 'om_race_bound');
    assert.equal(final.decision, undefined);
  });
}

test('expiry is evaluated after a contended lock is acquired', async t => {
  const { directory, request, event } = fixture(t);
  const lock = acquireRequestLock(directory, request.id);
  const contended = resolve(directory, 'waiting');
  const child = runChild(t, { directory, id: request.id, event: event('confirm'), operation: 'decide',
    timeoutMs: 5000, contended });
  try {
    await waitFor(contended); // The callback has entered decide while still valid.
    request.expiresAt = new Date(Date.now() + 100).toISOString();
    saveRequest(directory, request); // Parent owns the request transaction.
    await delay(150);
  } finally { lock.release(); }
  const result = await child;
  assert.equal(result.code, 0);
  assert.equal(result.result.status, 'expired');
  assert.equal(readRequest(directory, request.id).decision, undefined);
});

test('a rejected callback releases its lock so a valid decision can follow', t => {
  const { directory, request, event } = fixture(t);
  const invalid = event('confirm');
  invalid.action!.value!.nonce = 'incorrect';
  assert.throws(() => decide(directory, invalid), /mismatch/);
  assert.equal(existsSync(resolve(directory, request.id, 'request.lock')), false);
  assert.equal(decide(directory, event('confirm')).request.status, 'confirmed');
});
