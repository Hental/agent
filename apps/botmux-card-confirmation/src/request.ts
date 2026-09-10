import { isAbsolute } from 'node:path';
import { statSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { DEFAULT_OPTIONS, DEFAULT_TARGET } from './defaults.js';
import type { ButtonType, CardOption, ConfirmationInput, ConfirmationRequest, OptionResult, StoredOption, Target } from './types.js';

const SESSION_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function isSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === 'string' && SESSION_PATTERN.test(sessionId);
}

function isButtonType(value: unknown): value is ButtonType {
  return value === 'default' || value === 'primary' || value === 'danger';
}

function isOptionResult(value: unknown): value is OptionResult {
  return value === 'confirmed' || value === 'rejected' || value === 'selected';
}

function normalizeOption(option: CardOption, ids: Set<string>): StoredOption {
  if (!option || !/^[a-zA-Z0-9_-]{1,80}$/.test(option.id ?? '') || ids.has(option.id)) {
    throw new Error('Invalid or duplicate option ID');
  }
  ids.add(option.id);
  if (typeof option.label !== 'string' || !option.label.trim()) throw new Error('Missing option label');
  if (!isOptionResult(option.result)) throw new Error('Invalid option result');
  if (option.type !== undefined && !isButtonType(option.type)) throw new Error('Invalid button type');
  if (option.resultText !== undefined && typeof option.resultText !== 'string') throw new Error('Invalid result text');
  return {
    id: option.id, label: option.label, result: option.result,
    type: option.type ?? 'default', payload: option.payload ?? null,
    resultText: option.resultText ?? null,
  };
}

function validateTarget(target: Target): void {
  for (const [key, prefix] of [['larkAppId', 'cli_'], ['chatId', 'oc_'], ['operatorId', 'ou_']] as const) {
    if (typeof target[key] !== 'string' || !target[key].startsWith(prefix)) {
      throw new Error(`Missing verified target.${key}`);
    }
  }
}

export function createRequest(data: ConfirmationInput, sessionId: string, now = Date.now()): ConfirmationRequest {
  if (!isSessionId(sessionId)) throw new Error('Provide the full verified Botmux session ID');
  if (!data || typeof data.summary !== 'string' || !data.summary.trim()) throw new Error('Missing card summary');
  if (typeof data.expiresAt !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(data.expiresAt)
      || !(Date.parse(data.expiresAt) > now)) throw new Error('Provide a future expiry with an explicit timezone');
  if (data.testOnly !== undefined && typeof data.testOnly !== 'boolean') throw new Error('testOnly must be boolean');
  const target = data.target ?? DEFAULT_TARGET;
  validateTarget(target);
  const options = data.options ?? DEFAULT_OPTIONS;
  if (!Array.isArray(options) || !options.length || options.length > 20) throw new Error('Provide 1–20 options');
  const ids = new Set<string>();
  const normalized = options.map(option => normalizeOption(option, ids));
  if (data.selection !== undefined) {
    if (!data.selection || typeof data.selection.placeholder !== 'string' || !data.selection.placeholder.trim()
      || typeof data.selection.submitLabel !== 'string' || !data.selection.submitLabel.trim()
      || ids.has('__submit') || !normalized.some(option => option.result !== 'rejected')) {
      throw new Error('Invalid select form configuration');
    }
  }
  if (data.title !== undefined && (typeof data.title !== 'string' || !data.title.trim())) throw new Error('Invalid card title');
  const handling = data.actionHandling ?? { mode: 'local' };
  if (!handling || (handling.mode !== 'local' && handling.mode !== 'resume')) throw new Error('Invalid actionHandling mode');
  if (handling.mode === 'resume') {
    if (!['codex-cli', 'codex-app'].includes(handling.agent) || !isSessionId(handling.threadId)) {
      throw new Error('Resume requires explicit agent (codex-cli/codex-app) and full thread UUID');
    }
    if (typeof handling.cwd !== 'string' || !isAbsolute(handling.cwd) || !statSync(handling.cwd).isDirectory()) {
      throw new Error('Resume requires an existing absolute cwd');
    }
    if (handling.agent === 'codex-app' && (typeof handling.socketPath !== 'string'
      || !isAbsolute(handling.socketPath) || !statSync(handling.socketPath).isSocket())) {
      throw new Error('codex-app requires the owning runtime control socket');
    }
  }
  return {
    ...(data.selection ? { selection: { placeholder: data.selection.placeholder, submitLabel: data.selection.submitLabel } } : {}),
    actionHandling: handling.mode === 'local' ? { mode: 'local' } : {
      mode: 'resume', agent: handling.agent, threadId: handling.threadId, cwd: handling.cwd,
      ...(handling.agent === 'codex-app' ? { socketPath: handling.socketPath } : {}),
    },
    larkAppId: target.larkAppId, chatId: target.chatId, operatorId: target.operatorId,
    id: randomUUID(), nonce: randomBytes(24).toString('hex'), sessionId,
    title: data.title ?? '操作确认', summary: data.summary, options: normalized,
    context: data.context ?? null, snapshotPath: data.snapshotPath ?? null,
    testOnly: data.testOnly ?? false, expiresAt: data.expiresAt,
    createdAt: new Date(now).toISOString(), status: 'sending', messageId: null,
  };
}
