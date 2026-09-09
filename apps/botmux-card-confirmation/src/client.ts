import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readRequest, requestPath, saveRequest } from './state.js';
import { createRequest, isSessionId } from './request.js';
import { renderCard } from './card.js';
import { loadRuntime } from './runtime.js';
import { acquireRequestLock } from './lock.js';
import { PLUGIN_ID } from './defaults.js';
import { PENDING_STATUSES } from './types.js';
import type {
  BotmuxRunner, Client, ConfirmationInput, ConfirmationRequest, ConfirmationResult,
  RequestStatus, SendResult, ServiceHealth, Target,
} from './types.js';

export { DEFAULT_TARGET } from './defaults.js';
export type {
  BotmuxRunner, CardOption, Client, ConfirmationInput, ConfirmationResult,
  RequestStatus, SendResult, ServiceHealth, Target,
} from './types.js';

export const stateDir: string = loadRuntime().stateDir;

const execFileAsync = promisify(execFile);

async function runBotmux(args: string[]): Promise<Record<string, unknown>> {
  const { stdout } = await execFileAsync(process.env.BOTMUX_BIN ?? join(homedir(), '.botmux/bin/botmux'), args,
    { encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  return JSON.parse(stdout) as Record<string, unknown>;
}

function isSendResult(value: Record<string, unknown>): value is Record<string, unknown> & SendResult {
  return value.success === true && typeof value.messageId === 'string' && value.messageId.length > 0
    && typeof value.sessionId === 'string';
}

export async function health(): Promise<ServiceHealth> {
  const service = JSON.parse(readFileSync(join(homedir(), `.botmux/plugins/${PLUGIN_ID}/service.json`), 'utf8')) as {
    status: string; pluginId: string; port: number; pid: number;
  };
  if (service.status !== 'online' || service.pluginId !== PLUGIN_ID || service.port !== 19361) {
    throw new Error('Card confirmation service is not ready');
  }
  const response = await fetch('http://127.0.0.1:19361/health', { signal: AbortSignal.timeout(2000) });
  const result = await response.json() as { ok: boolean; pid: number; pluginId: string };
  if (!response.ok || !result.ok || result.pid !== service.pid || result.pluginId !== PLUGIN_ID) {
    throw new Error('Card confirmation service identity mismatch');
  }
  return { ok: true, pid: result.pid, pluginId: result.pluginId, gateway: 'botmux' };
}

function publicRequest(request: ConfirmationRequest): RequestStatus {
  const { nonce: _nonce, ...result } = request;
  return result;
}

function containsCallback(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const node = value as { type?: unknown; tag?: unknown; value?: unknown };
  if (node.type === 'callback' || (node.tag === 'button' && node.value)) return true;
  return Object.values(value as Record<string, unknown>).some(containsCallback);
}

export interface ClientOptions {
  directory?: string;
  run?: BotmuxRunner;
  checkService?: () => Promise<unknown>;
}

export function createClient({ directory = stateDir, run = runBotmux, checkService = health }: ClientOptions = {}): Client {
  function artifact(id: string, name: string, value: unknown): string {
    const dir = join(directory, id);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const path = join(dir, name);
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
    return path;
  }
  async function verifySession(sessionId: string, target?: Target): Promise<void> {
    if (!isSessionId(sessionId)) throw new Error('Provide the full verified Botmux session ID');
    if (!target) return;
    const history = await run(['history', '--session-id', sessionId, '--limit', '1']);
    if (history.sessionId !== sessionId || history.chatId !== target.chatId) {
      throw new Error('Botmux session does not match the verified recipient');
    }
  }
  async function sendCard(card: unknown, sessionId: string, target?: Target): Promise<SendResult> {
    await verifySession(sessionId, target);
    const node = card as { schema?: unknown; body?: { elements?: unknown } } | null;
    if (node?.schema !== '2.0' || !Array.isArray(node.body?.elements)) throw new Error('Provide a schema 2.0 card');
    if (containsCallback(card)) throw new Error('Callback cards must use sendConfirmation with registered options');
    const id = randomUUID();
    const path = artifact(id, 'message-card.json', card);
    const result = await run(['send', '--session-id', sessionId, '--no-mention', '--card-file', path]);
    artifact(id, 'send-result.json', result);
    if (!isSendResult(result) || result.sessionId !== sessionId) {
      throw new Error('Send result not verified; inspect Botmux history before retrying');
    }
    return result;
  }
  async function patch(id: string): Promise<Record<string, unknown>> {
    const lock = acquireRequestLock(directory, id);
    let request: ConfirmationRequest;
    try {
      request = readRequest(directory, id);
      if (PENDING_STATUSES.includes(request.status)) {
        throw new Error('Only terminal cards can be patched; invalidate a pending request first');
      }
    } finally {
      lock.release();
    }
    const path = artifact(id, 'card-updated.json', renderCard(request));
    const result = await run(['card', 'patch', '--session-id', request.sessionId, '--message-id', request.messageId ?? '', '--card-file', path]);
    if (result.success !== true) throw new Error('Card update not verified');
    const writeLock = acquireRequestLock(directory, id);
    try {
      const fresh = readRequest(directory, id);
      fresh.cardPatched = true;
      delete fresh.cardPatchError;
      saveRequest(directory, fresh);
    } finally {
      writeLock.release();
    }
    return result;
  }
  async function status(id: string, reconcile = true): Promise<RequestStatus> {
    const expireLock = acquireRequestLock(directory, id);
    try {
      const request = readRequest(directory, id);
      if (request.status === 'pending' && !(Date.now() < Date.parse(request.expiresAt))) {
        request.status = 'expired';
        saveRequest(directory, request);
      }
    } finally {
      expireLock.release();
    }
    const current = readRequest(directory, id);
    if (reconcile && current.messageId && !PENDING_STATUSES.includes(current.status) && !current.cardPatched) {
      try {
        await patch(id);
      } catch {
        const lock = acquireRequestLock(directory, id);
        try {
          const fresh = readRequest(directory, id);
          fresh.cardPatchError = 'Card update failed; use patch to retry';
          saveRequest(directory, fresh);
        } finally {
          lock.release();
        }
      }
    }
    return publicRequest(readRequest(directory, id));
  }
  async function invalidate(id: string): Promise<RequestStatus> {
    const lock = acquireRequestLock(directory, id);
    try {
      const request = readRequest(directory, id);
      if (PENDING_STATUSES.includes(request.status)) {
        request.status = 'invalidated';
        saveRequest(directory, request);
      }
    } finally {
      lock.release();
    }
    return status(id);
  }
  async function sendConfirmation(data: ConfirmationInput, sessionId: string): Promise<ConfirmationResult> {
    const request = createRequest(data, sessionId);
    await verifySession(sessionId, request);
    await checkService();
    // Initialize the request record inside the lock and never overwrite an
    // existing record for the same ID.
    const initLock = acquireRequestLock(directory, request.id);
    try {
      if (existsSync(requestPath(directory, request.id))) {
        throw new Error(`Request ${request.id} already exists; refusing to overwrite it`);
      }
      saveRequest(directory, request);
    } finally {
      initLock.release();
    }
    const path = artifact(request.id, 'card.json', renderCard({ ...request, status: 'pending' }));
    try {
      const result = await run(['send', '--session-id', sessionId, '--no-mention', '--card-file', path, '--plugin-card-action', PLUGIN_ID]);
      artifact(request.id, 'send-result.json', result);
      if (!isSendResult(result) || result.sessionId !== sessionId) throw new Error('Unverified send result');
      // The gateway call happened outside the lock; re-read the latest state.
      // A concurrently invalidated/expired/decided request keeps its terminal
      // status; the verified message ID is bound only for terminal-card
      // reconciliation and never revives the request or re-enables callbacks.
      const lock = acquireRequestLock(directory, request.id);
      try {
        const latest = readRequest(directory, request.id);
        if (PENDING_STATUSES.includes(latest.status)) {
          latest.messageId = result.messageId;
          latest.status = 'pending';
          saveRequest(directory, latest);
        } else if (!latest.messageId) {
          latest.messageId = result.messageId;
          saveRequest(directory, latest);
        }
      } finally {
        lock.release();
      }
      return { success: true, requestId: request.id, messageId: result.messageId, sessionId, testOnly: request.testOnly };
    } catch (error) {
      // Preserve any terminal state committed while the gateway send was in
      // flight: only a still-'sending' request may become 'send_unknown'.
      try {
        const lock = acquireRequestLock(directory, request.id);
        try {
          const latest = readRequest(directory, request.id);
          if (latest.status === 'sending') {
            latest.status = 'send_unknown';
            saveRequest(directory, latest);
          }
        } finally {
          lock.release();
        }
      } catch {
        // Fail closed: without the lock we must not touch the record at all.
      }
      throw new Error(`Send result unknown for ${request.id}; inspect Botmux history before retrying`);
    }
  }
  return { sendConfirmation, sendCard, status, invalidate, patch };
}

export const client: Client = createClient();
