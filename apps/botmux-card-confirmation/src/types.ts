export interface Target {
  larkAppId: string;
  chatId: string;
  operatorId: string;
}

export type OptionResult = 'confirmed' | 'rejected' | 'selected';
export type ButtonType = 'default' | 'primary' | 'danger';

export interface CardOption {
  id: string;
  label: string;
  result: OptionResult;
  type?: ButtonType;
  payload?: unknown;
  resultText?: string;
}

export type ActionHandling = { mode: 'local' } | {
  mode: 'resume';
  agent: 'codex-cli' | 'codex-app';
  threadId: string;
  cwd: string;
  /** Required for codex-app: control socket of the owning runtime. */
  socketPath?: string;
};

export interface ResumeDelivery {
  status: 'queued' | 'dispatching' | 'started' | 'completed' | 'unknown' | 'cancelled';
  updatedAt: string;
  turnId?: string;
}

export interface ConfirmationInput {
  actionHandling?: ActionHandling;
  title?: string;
  summary: string;
  expiresAt: string;
  testOnly?: boolean;
  target?: Target;
  options?: CardOption[];
  context?: unknown;
  snapshotPath?: string;
}

export interface StoredOption {
  id: string;
  label: string;
  result: OptionResult;
  type: ButtonType;
  payload: unknown;
  resultText: string | null;
}

export type RequestLifecycle =
  | 'sending'
  | 'pending'
  | 'send_unknown'
  | 'confirmed'
  | 'rejected'
  | 'selected'
  | 'expired'
  | 'invalidated';

export const PENDING_STATUSES: readonly RequestLifecycle[] = ['pending', 'sending', 'send_unknown'];

export interface Decision {
  value: string;
  label: string;
  payload: unknown;
  resultText: string | null;
  by: string;
  receivedAt: string;
  eventId?: string;
  messageId: string;
  source: 'botmux-card-action';
}

/** Internal persisted request; `nonce` is never exposed to callers. */
export interface ConfirmationRequest {
  larkAppId: string;
  chatId: string;
  operatorId: string;
  id: string;
  nonce: string;
  sessionId: string;
  title: string;
  summary: string;
  options: StoredOption[];
  context: unknown;
  snapshotPath: string | null;
  testOnly: boolean;
  expiresAt: string;
  createdAt: string;
  status: RequestLifecycle;
  messageId: string | null;
  decision?: Decision;
  actionHandling?: ActionHandling;
  resumeDelivery?: ResumeDelivery;
  cardPatched?: boolean;
  cardPatchError?: string;
}

export type RequestStatus = Omit<ConfirmationRequest, 'nonce'>;

export interface SendResult {
  success: true;
  messageId: string;
  sessionId: string;
}

export interface ConfirmationResult extends SendResult {
  requestId: string;
  testOnly: boolean;
}

export type BotmuxRunner = (args: string[]) => Promise<Record<string, unknown>>;

export interface Client {
  sendConfirmation(data: ConfirmationInput, sessionId: string): Promise<ConfirmationResult>;
  sendCard(card: unknown, sessionId: string, target?: Target): Promise<SendResult>;
  status(id: string, reconcile?: boolean): Promise<RequestStatus>;
  invalidate(id: string): Promise<RequestStatus>;
  patch(id: string): Promise<Record<string, unknown>>;
}

export interface ServiceHealth {
  ok: true;
  pid: number;
  pluginId: string;
  gateway: 'botmux';
}

export interface RuntimeConfig {
  stateDir: string;
  node: string;
}

/** Botmux card-action callback boundary. All fields are runtime-validated. */
export interface CardActionValue {
  action: string;
  requestId: string;
  nonce: string;
  optionId: string;
  payload?: unknown;
}

export interface CardActionEvent {
  schemaVersion: number;
  actionName: string;
  larkAppId: string;
  eventId?: string;
  operator?: { open_id?: string };
  context?: { open_chat_id?: string; open_message_id?: string };
  action?: { value?: CardActionValue };
}
