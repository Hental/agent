import type { AppConfig } from './config.js';
import { EventStore, type MessageEvent } from './event-store.js';
import { TaskQueue } from './task-queue.js';

export type EnqueueResult =
  | { kind: 'accepted'; event: MessageEvent }
  | { kind: 'not_found' }
  | { kind: 'processing' | 'processed'; event: MessageEvent };

export interface MessageProcessorDependencies {
  store: EventStore;
  queue: TaskQueue;
  replyText(messageId: string, text: string): Promise<unknown>;
  config: Pick<AppConfig, 'replyPrefix'>;
}

export class MessageProcessor {
  constructor(private readonly dependencies: MessageProcessorDependencies) {}

  enqueue(eventId: string): EnqueueResult {
    const claim = this.dependencies.store.claim(eventId);
    if (claim.kind !== 'claimed') return claim;

    void this.dependencies.queue
      .add(() => this.processClaimed(claim.event))
      .catch((error) => console.error(`事件 ${eventId} 队列任务失败：`, error));
    return { kind: 'accepted', event: claim.event };
  }

  private async processClaimed(event: MessageEvent): Promise<void> {
    try {
      if (event.messageType !== 'text' || !event.text) {
        throw new Error(`暂不支持处理消息类型 ${event.messageType}`);
      }
      await this.dependencies.replyText(
        event.messageId,
        `${this.dependencies.config.replyPrefix}${event.text}`,
      );
      this.dependencies.store.markProcessed(event.id);
      console.log(JSON.stringify({ event: 'message.processed', eventId: event.id }));
    } catch (error) {
      this.dependencies.store.markFailed(event.id, error);
      console.error(`事件 ${event.id} 处理失败：`, error);
    }
  }
}
