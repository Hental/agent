import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ACTION_NAME } from './defaults.mjs';
export function requestPath(dir, id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id ?? '')) {
    throw new Error('Invalid request ID');
  }
  return join(dir, id, 'request.json');
}
export function readRequest(dir, id) {
  return JSON.parse(readFileSync(requestPath(dir, id), 'utf8'));
}
export function saveRequest(dir, request) {
  const path = requestPath(dir, request.id);
  mkdirSync(join(dir, request.id), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tmp, JSON.stringify(request, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  renameSync(tmp, path);
}

// Only the authenticated callback service calls this with an event from Botmux.
// Synchronous read/check/write keeps first-decision handling serial in this process.
export function decide(dir, event, now = Date.now()) {
  if (event?.schemaVersion !== 1 || event.actionName !== ACTION_NAME) {
    throw new Error('Unsupported callback');
  }
  const value = event.action?.value;
  const request = readRequest(dir, value?.requestId);
  const option = request.options.find(item => item.id === value.optionId);
  if (!option || value.action !== ACTION_NAME) throw new Error('Unknown option');
  if (event.larkAppId !== request.larkAppId || event.operator?.open_id !== request.operatorId
      || event.context?.open_chat_id !== request.chatId
      || !request.messageId || event.context?.open_message_id !== request.messageId
      || value.nonce !== request.nonce) {
    throw new Error('Callback identity or message mismatch');
  }
  if (request.status !== 'pending') return { request, repeated: true };
  if (!Number.isFinite(Date.parse(request.expiresAt)) || now >= Date.parse(request.expiresAt)) {
    request.status = 'expired';
  } else {
    request.status = option.result;
    request.decision = {
      value: option.id, label: option.label, payload: option.payload, resultText: option.resultText,
      by: event.operator.open_id,
      receivedAt: new Date(now).toISOString(), eventId: event.eventId,
      messageId: event.context.open_message_id, source: 'botmux-card-action',
    };
  }
  saveRequest(dir, request);
  return { request, repeated: false };
}
