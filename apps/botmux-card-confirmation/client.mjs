import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { readRequest, saveRequest } from './src/state.mjs';
import { createRequest } from './src/request.mjs';
import { renderCard } from './src/card.mjs';
import { PLUGIN_ID } from './src/defaults.mjs';
export { DEFAULT_TARGET } from './src/defaults.mjs';

export const stateDir = resolve(import.meta.dirname, '../../.reports/botmux-card-confirmation');
const execFileAsync = promisify(execFile);
async function runBotmux(args) {
  const { stdout } = await execFileAsync(process.env.BOTMUX_BIN ?? join(homedir(), '.botmux/bin/botmux'), args,
    { encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout);
}
export async function health() {
  const service = JSON.parse(readFileSync(join(homedir(), `.botmux/plugins/${PLUGIN_ID}/service.json`), 'utf8'));
  if (service.status !== 'online' || service.pluginId !== PLUGIN_ID || service.port !== 19361) throw new Error('Card confirmation service is not ready');
  const response = await fetch('http://127.0.0.1:19361/health', { signal: AbortSignal.timeout(2000) });
  const result = await response.json();
  if (!response.ok || !result.ok || result.pid !== service.pid || result.pluginId !== PLUGIN_ID) throw new Error('Card confirmation service identity mismatch');
  return { ...result, gateway: 'botmux' };
}
function publicRequest(request) {
  const { nonce, ...result } = request;
  return result;
}
function containsCallback(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.type === 'callback' || (value.tag === 'button' && value.value)) return true;
  return Object.values(value).some(containsCallback);
}
export function createClient({ directory = stateDir, run = runBotmux, checkService = health } = {}) {
  function artifact(id, name, value) {
    const dir = join(directory, id);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const path = join(dir, name);
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
    return path;
  }
  async function verifySession(sessionId, target) {
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(sessionId ?? '')) throw new Error('Provide the full verified Botmux session ID');
    if (!target) return;
    const history = await run(['history', '--session-id', sessionId, '--limit', '1']);
    if (history.sessionId !== sessionId || history.chatId !== target.chatId) throw new Error('Botmux session does not match the verified recipient');
  }
  async function sendCard(card, sessionId, target) {
    await verifySession(sessionId, target);
    if (card?.schema !== '2.0' || !Array.isArray(card.body?.elements)) throw new Error('Provide a schema 2.0 card');
    if (containsCallback(card)) throw new Error('Callback cards must use sendConfirmation with registered options');
    const id = randomUUID();
    const path = artifact(id, 'message-card.json', card);
    const result = await run(['send', '--session-id', sessionId, '--no-mention', '--card-file', path]);
    artifact(id, 'send-result.json', result);
    if (result.success !== true || !result.messageId || result.sessionId !== sessionId) throw new Error('Send result not verified; inspect Botmux history before retrying');
    return result;
  }
  async function patch(id) {
    const request = readRequest(directory, id);
    if (['pending', 'sending', 'send_unknown'].includes(request.status)) throw new Error('Only terminal cards can be patched; invalidate a pending request first');
    const path = artifact(id, 'card-updated.json', renderCard(request));
    const result = await run(['card', 'patch', '--session-id', request.sessionId, '--message-id', request.messageId, '--card-file', path]);
    if (result.success !== true) throw new Error('Card update not verified');
    const fresh = readRequest(directory, id);
    fresh.cardPatched = true;
    delete fresh.cardPatchError;
    saveRequest(directory, fresh);
    return result;
  }
  async function status(id, reconcile = true) {
    const request = readRequest(directory, id);
    if (request.status === 'pending' && !(Date.now() < Date.parse(request.expiresAt))) {
      request.status = 'expired'; saveRequest(directory, request);
    }
    if (reconcile && request.messageId && !['pending', 'sending', 'send_unknown'].includes(request.status) && !request.cardPatched) {
      try { await patch(id); } catch {
        const fresh = readRequest(directory, id);
        fresh.cardPatchError = 'Card update failed; use patch to retry'; saveRequest(directory, fresh);
      }
    }
    return publicRequest(readRequest(directory, id));
  }
  async function invalidate(id) {
    const request = readRequest(directory, id);
    if (!['pending', 'sending', 'send_unknown'].includes(request.status)) return status(id);
    request.status = 'invalidated'; saveRequest(directory, request);
    return status(id);
  }
  async function sendConfirmation(data, sessionId) {
    const request = createRequest(data, sessionId);
    await verifySession(sessionId, request);
    await checkService();
    saveRequest(directory, request);
    const path = artifact(request.id, 'card.json', renderCard({ ...request, status: 'pending' }));
    try {
      const result = await run(['send', '--session-id', sessionId, '--no-mention', '--card-file', path, '--plugin-card-action', PLUGIN_ID]);
      artifact(request.id, 'send-result.json', result);
      if (result.success !== true || !result.messageId || result.sessionId !== sessionId) throw new Error('Unverified send result');
      request.messageId = result.messageId;
      request.status = 'pending'; saveRequest(directory, request);
      return { success: true, requestId: request.id, messageId: request.messageId, sessionId, testOnly: request.testOnly };
    } catch {
      request.status = 'send_unknown'; saveRequest(directory, request);
      throw new Error(`Send result unknown for ${request.id}; inspect Botmux history before retrying`);
    }
  }
  return { sendConfirmation, sendCard, status, invalidate, patch };
}
export const client = createClient();
