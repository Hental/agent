export type BookingDecision = 'confirm_order' | 'cancel_order' | 'select_course';

export interface CardActionEvent {
  id: string;
  requestId: string;
  action: BookingDecision;
  scheduleId?: string;
  operatorId: string;
  createdAt: string;
}

export class CardActionStore {
  private readonly events: CardActionEvent[] = [];
  private readonly seen = new Set<string>();

  constructor(readonly capacity = 500) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('capacity 必须是正整数');
  }

  add(input: Omit<CardActionEvent, 'createdAt'>): { event: CardActionEvent; created: boolean } {
    const existing = this.events.find((event) => event.id === input.id);
    if (existing || this.seen.has(input.id)) {
      return { event: existing ?? { ...input, createdAt: new Date().toISOString() }, created: false };
    }
    const event = { ...input, createdAt: new Date().toISOString() };
    this.events.push(event);
    this.seen.add(event.id);
    if (this.events.length > this.capacity) {
      const removed = this.events.shift();
      if (removed) this.seen.delete(removed.id);
    }
    return { event: { ...event }, created: true };
  }

  list(requestId: string): CardActionEvent[] {
    return this.events.filter((event) => event.requestId === requestId).map((event) => ({ ...event }));
  }
}
