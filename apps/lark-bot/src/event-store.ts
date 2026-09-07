export type EventStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface MessageEvent {
  id: string;
  messageId: string;
  chatId: string;
  senderId: string;
  messageType: string;
  text: string;
  status: EventStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface NewMessageEvent {
  id: string;
  messageId: string;
  chatId: string;
  senderId: string;
  messageType: string;
  text: string;
}

export type ClaimResult =
  | { kind: 'claimed'; event: MessageEvent }
  | { kind: 'not_found' }
  | { kind: 'processing' | 'processed'; event: MessageEvent };

function clone(event: MessageEvent): MessageEvent {
  return { ...event };
}

export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, ' ').trim().slice(0, 300) || 'unknown error';
}

export class EventStore {
  private readonly events = new Map<string, MessageEvent>();

  constructor(readonly capacity = 500) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('capacity 必须是正整数');
    }
  }

  add(input: NewMessageEvent): { event: MessageEvent; created: boolean } {
    const existing = this.events.get(input.id);
    if (existing) return { event: clone(existing), created: false };

    this.evictIfFull();
    const now = new Date().toISOString();
    const event: MessageEvent = {
      ...input,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(event.id, event);
    return { event: clone(event), created: true };
  }

  get(id: string): MessageEvent | undefined {
    const event = this.events.get(id);
    return event ? clone(event) : undefined;
  }

  list(limit = 50): MessageEvent[] {
    return [...this.events.values()].slice(-limit).reverse().map(clone);
  }

  claim(id: string): ClaimResult {
    const event = this.events.get(id);
    if (!event) return { kind: 'not_found' };
    if (event.status === 'processing' || event.status === 'processed') {
      return { kind: event.status, event: clone(event) };
    }

    event.status = 'processing';
    event.attempts += 1;
    event.updatedAt = new Date().toISOString();
    delete event.error;
    return { kind: 'claimed', event: clone(event) };
  }

  markProcessed(id: string): MessageEvent | undefined {
    return this.update(id, 'processed');
  }

  markFailed(id: string, error: unknown): MessageEvent | undefined {
    return this.update(id, 'failed', safeError(error));
  }

  get size(): number {
    return this.events.size;
  }

  private update(id: string, status: EventStatus, error?: string): MessageEvent | undefined {
    const event = this.events.get(id);
    if (!event) return undefined;
    event.status = status;
    event.updatedAt = new Date().toISOString();
    if (error) event.error = error;
    else delete event.error;
    return clone(event);
  }

  private evictIfFull(): void {
    if (this.events.size < this.capacity) return;
    const terminal = [...this.events.entries()].find(([, event]) => (
      event.status === 'processed' || event.status === 'failed'
    ));
    const oldestId = terminal?.[0] ?? this.events.keys().next().value;
    if (oldestId) this.events.delete(oldestId);
  }
}
