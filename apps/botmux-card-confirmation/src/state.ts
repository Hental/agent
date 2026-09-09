import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ACTION_NAME } from './defaults.js';
import { acquireRequestLock } from './lock.js';
import type { CardActionEvent, CardActionValue, ConfirmationRequest } from './types.js';

export function requestPath(dir: string, id: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id ?? '')) {
    throw new Error('Invalid request ID');
  }
  return join(dir, id, 'request.json');
}

export function readRequest(dir: string, id: string): ConfirmationRequest {
  return JSON.parse(readFileSync(requestPath(dir, id), 'utf8')) as ConfirmationRequest;
}

export function saveRequest(dir: string, request: ConfirmationRequest): void {
  // Existing records must be read and written while holding acquireRequestLock.
  // Atomic replacement prevents partial JSON reads, not competing updates.
  const path = requestPath(dir, request.id);
  mkdirSync(join(dir, request.id), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tmp, JSON.stringify(request, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  renameSync(tmp, path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Runtime validation of the externally supplied Botmux callback event.
function validateEvent(event: unknown): asserts event is CardActionEvent {
  if (!isRecord(event) || event.schemaVersion !== 1 || event.actionName !== ACTION_NAME) {
    throw new Error('Unsupported callback');
  }
  const value: unknown = isRecord(event.action) ? event.action.value : undefined;
  if (!isRecord(value)) throw new Error('Unsupported callback');
  const action = value as Partial<CardActionValue>;
  if (typeof action.action !== 'string' || typeof action.requestId !== 'string'
      || typeof action.nonce !== 'string' || typeof action.optionId !== 'string') {
    throw new Error('Unsupported callback');
  }
}

// Only the authenticated callback service calls this with an event from Botmux.
// The whole read-check-write runs under a cross-process per-request lock so a
// decision can never overwrite a terminal state committed by another process.
// Lock contention fails closed after a bounded wait: the decision is NOT
// accepted. `now` is evaluated after the lock is acquired so expiry reflects
// commit time, not call time.
export function decide(dir: string, event: unknown, now?: number, lockTimeoutMs?: number): { request: ConfirmationRequest; repeated: boolean } {
  validateEvent(event);
  const value = event.action!.value!;
  const lock = acquireRequestLock(dir, value.requestId, lockTimeoutMs);
  try {
    const effectiveNow = now ?? Date.now();
    const request = readRequest(dir, value.requestId);
    const option = request.options.find(item => item.id === value.optionId);
    if (!option || value.action !== ACTION_NAME) throw new Error('Unknown option');
    if (event.larkAppId !== request.larkAppId || event.operator?.open_id !== request.operatorId
        || event.context?.open_chat_id !== request.chatId
        || !request.messageId || event.context?.open_message_id !== request.messageId
        || value.nonce !== request.nonce) {
      throw new Error('Callback identity or message mismatch');
    }
    if (request.status !== 'pending') return { request, repeated: true };
    if (!Number.isFinite(Date.parse(request.expiresAt)) || effectiveNow >= Date.parse(request.expiresAt)) {
      request.status = 'expired';
    } else {
      request.status = option.result;
      if (request.actionHandling?.mode === 'resume' && request.resumeDelivery?.status !== 'cancelled') {
        request.resumeDelivery = { status: 'queued', updatedAt: new Date(effectiveNow).toISOString() };
      }
      request.decision = {
        value: option.id, label: option.label, payload: option.payload, resultText: option.resultText,
        by: event.operator!.open_id!,
        receivedAt: new Date(effectiveNow).toISOString(), eventId: event.eventId,
        messageId: event.context!.open_message_id!, source: 'botmux-card-action',
      };
    }
    saveRequest(dir, request);
    return { request, repeated: false };
  } finally {
    lock.release();
  }
}
