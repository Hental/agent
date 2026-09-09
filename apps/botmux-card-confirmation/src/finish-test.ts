// Keep a user-click test bounded: patch its result and close our compatibility server.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { readRequest } from './state.js';
import { loadRuntime } from './runtime.js';
import { PENDING_STATUSES } from './types.js';

const id = process.argv[2];
if (!id) throw new Error('Provide the test request ID');

function isPendingLifecycle(value: unknown): value is (typeof PENDING_STATUSES)[number] {
  return typeof value === 'string' && (PENDING_STATUSES as readonly string[]).includes(value);
}
const dir = loadRuntime().stateDir;
const metadataPath = resolve(homedir(), '.botmux/plugins/card-confirmation/service.json');
const confirmScript = resolve(import.meta.dirname, 'confirm.js');
const initialService = JSON.parse(readFileSync(metadataPath, 'utf8')) as { manager: string; pid: number };
if (initialService.manager !== 'foreground-compatibility-runner') throw new Error('Not our compatibility service');
const initial = readRequest(dir, id);
if (initial.testOnly !== true) throw new Error('This runner only handles test cards');
if (!Number.isFinite(Date.parse(initial.expiresAt)) || Date.parse(initial.expiresAt) > Date.now() + 15 * 60 * 1000) {
  throw new Error('Test expiry must be within 15 minutes');
}
while (true) {
  const request = readRequest(dir, id);
  if (request.status !== 'pending' || Date.now() >= Date.parse(request.expiresAt)) break;
  await delay(1500);
}
try {
  // status expires a pending request; patch reconciles the final display without buttons.
  execFileSync(process.execPath, [confirmScript, 'status', id], { stdio: 'pipe' });
  execFileSync(process.execPath, [confirmScript, 'patch', id], { stdio: 'pipe' });
  const { status, decision, messageId, testOnly } = readRequest(dir, id);
  const result = { requestId: id, status, decision, messageId, testOnly, cardPatched: true };
  writeFileSync(resolve(dir, id, 'test-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  const otherPending = readdirSync(dir).some(otherId => {
    const path = resolve(dir, otherId, 'request.json');
    if (otherId === id || !existsSync(path)) return false;
    const other = JSON.parse(readFileSync(path, 'utf8')) as { status?: unknown; expiresAt?: unknown };
    return isPendingLifecycle(other.status)
      && typeof other.expiresAt === 'string'
      && !(Date.now() >= Date.parse(other.expiresAt));
  });
  const service = JSON.parse(readFileSync(metadataPath, 'utf8')) as { manager: string; pid: number };
  const health = await (await fetch('http://127.0.0.1:19361/health', { signal: AbortSignal.timeout(1000) })).json() as { pid: number };
  if (!otherPending && service.manager === initialService.manager && service.pid === initialService.pid && health.pid === service.pid) {
    process.kill(service.pid, 'SIGTERM');
  }
}
