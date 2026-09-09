export interface Target { larkAppId: string; chatId: string; operatorId: string }
export const DEFAULT_TARGET: Readonly<Target>;
export interface CardOption {
  id: string; label: string; result: 'confirmed' | 'rejected' | 'selected';
  type?: 'default' | 'primary' | 'danger'; payload?: unknown; resultText?: string;
}
export interface ConfirmationInput {
  title?: string; summary: string; expiresAt: string; testOnly?: boolean; target?: Target;
  options?: CardOption[]; context?: unknown; snapshotPath?: string;
}
export interface SendResult { success: true; messageId: string; sessionId: string }
export interface ConfirmationResult extends SendResult { requestId: string; testOnly: boolean }
export interface RequestStatus {
  id: string; status: string; testOnly: boolean; expiresAt: string; context: unknown;
  decision?: { value: string; label: string; payload: unknown; by: string; source: string; eventId?: string; messageId: string };
  cardPatched?: boolean; cardPatchError?: string;
}
export interface Client {
  sendConfirmation(data: ConfirmationInput, sessionId: string): Promise<ConfirmationResult>;
  sendCard(card: object, sessionId: string, target?: Target): Promise<SendResult>;
  status(id: string, reconcile?: boolean): Promise<RequestStatus>;
  invalidate(id: string): Promise<RequestStatus>;
  patch(id: string): Promise<unknown>;
}
export const client: Client;
export const stateDir: string;
export function health(): Promise<{ ok: true; pid: number; pluginId: string; gateway: string }>;
export function createClient(options?: { directory?: string; run?: (args: string[]) => Promise<any>; checkService?: () => Promise<any> }): Client;
