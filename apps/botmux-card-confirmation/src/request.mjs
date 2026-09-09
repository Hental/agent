import { randomBytes, randomUUID } from 'node:crypto';
import { DEFAULT_OPTIONS, DEFAULT_TARGET } from './defaults.mjs';

export function createRequest(data, sessionId, now = Date.now()) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(sessionId ?? '')) throw new Error('Provide the full verified Botmux session ID');
  if (!data || typeof data.summary !== 'string' || !data.summary.trim()) throw new Error('Missing card summary');
  if (typeof data.expiresAt !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(data.expiresAt)
      || !(Date.parse(data.expiresAt) > now)) throw new Error('Provide a future expiry with an explicit timezone');
  if (data.testOnly !== undefined && typeof data.testOnly !== 'boolean') throw new Error('testOnly must be boolean');
  const target = data.target ?? DEFAULT_TARGET;
  for (const [key, prefix] of [['larkAppId', 'cli_'], ['chatId', 'oc_'], ['operatorId', 'ou_']]) {
    if (typeof target[key] !== 'string' || !target[key].startsWith(prefix)) throw new Error(`Missing verified target.${key}`);
  }
  const options = data.options ?? DEFAULT_OPTIONS;
  if (!Array.isArray(options) || !options.length || options.length > 20) throw new Error('Provide 1–20 options');
  const ids = new Set();
  const normalized = options.map(option => {
    if (!option || !/^[a-zA-Z0-9_-]{1,80}$/.test(option.id ?? '') || ids.has(option.id)) throw new Error('Invalid or duplicate option ID');
    ids.add(option.id);
    if (typeof option.label !== 'string' || !option.label.trim()) throw new Error('Missing option label');
    if (!['confirmed', 'rejected', 'selected'].includes(option.result)) throw new Error('Invalid option result');
    if (option.type && !['default', 'primary', 'danger'].includes(option.type)) throw new Error('Invalid button type');
    if (option.resultText !== undefined && typeof option.resultText !== 'string') throw new Error('Invalid result text');
    return { id: option.id, label: option.label, result: option.result, type: option.type ?? 'default',
      payload: option.payload ?? null, resultText: option.resultText ?? null };
  });
  if (data.title !== undefined && (typeof data.title !== 'string' || !data.title.trim())) throw new Error('Invalid card title');
  return {
    larkAppId: target.larkAppId, chatId: target.chatId, operatorId: target.operatorId,
    id: randomUUID(), nonce: randomBytes(24).toString('hex'), sessionId,
    title: data.title ?? '操作确认', summary: data.summary, options: normalized,
    context: data.context ?? null, snapshotPath: data.snapshotPath ?? null,
    testOnly: data.testOnly ?? false, expiresAt: data.expiresAt,
    createdAt: new Date(now).toISOString(), status: 'sending', messageId: null,
  };
}
