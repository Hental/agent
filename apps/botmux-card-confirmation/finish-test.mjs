// Keep a user-click test bounded: patch its result and close our compatibility server.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { readRequest } from './src/state.mjs';

const id = process.argv[2];
const dir = resolve(import.meta.dirname, '../../.reports/botmux-card-confirmation');
const metadataPath = resolve(homedir(), '.botmux/plugins/card-confirmation/service.json');
const initialService = JSON.parse(readFileSync(metadataPath, 'utf8'));
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
  execFileSync(process.execPath, [resolve(import.meta.dirname, 'confirm.mjs'), 'status', id], { stdio: 'pipe' });
  execFileSync(process.execPath, [resolve(import.meta.dirname, 'confirm.mjs'), 'patch', id], { stdio: 'pipe' });
  const { status, decision, messageId, testOnly } = readRequest(dir, id);
  const result = { requestId: id, status, decision, messageId, testOnly, cardPatched: true };
  writeFileSync(resolve(dir, id, 'test-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  const otherPending = readdirSync(dir).some(otherId => {
    const path = resolve(dir, otherId, 'request.json');
    if (otherId === id || !existsSync(path)) return false;
    const other = JSON.parse(readFileSync(path, 'utf8'));
    return ['pending', 'sending', 'send_unknown'].includes(other.status)
      && !(Date.now() >= Date.parse(other.expiresAt));
  });
  const service = JSON.parse(readFileSync(metadataPath, 'utf8'));
  const health = await (await fetch('http://127.0.0.1:19361/health', { signal: AbortSignal.timeout(1000) })).json();
  if (!otherPending && service.manager === initialService.manager && service.pid === initialService.pid && health.pid === service.pid) {
    process.kill(service.pid, 'SIGTERM');
  }
}
