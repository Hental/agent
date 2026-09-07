import { describe, expect, it, rs } from '@rstest/core';
import { EventStore } from '../src/event-store.js';
import { MessageProcessor } from '../src/message-processor.js';
import { TaskQueue } from '../src/task-queue.js';

function addEvent(store: EventStore, id = 'evt_1') {
  store.add({
    id,
    messageId: 'om_1',
    chatId: 'oc_1',
    senderId: 'ou_1',
    messageType: 'text',
    text: 'hello',
  });
}

describe('MessageProcessor', () => {
  it('processes exactly once and prefixes the reply', async () => {
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    const store = new EventStore();
    const queue = new TaskQueue();
    const replyText = rs.fn(async () => undefined);
    addEvent(store);
    const processor = new MessageProcessor({ store, queue, replyText, config: { replyPrefix: '收到：' } });

    expect(processor.enqueue('evt_1').kind).toBe('accepted');
    await queue.onIdle();
    expect(store.get('evt_1')?.status).toBe('processed');
    expect(replyText).toHaveBeenCalledWith('om_1', '收到：hello');
    expect(processor.enqueue('evt_1').kind).toBe('processed');
    expect(replyText).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it('allows a failed event to be retried', async () => {
    const errorLog = rs.spyOn(console, 'error').mockImplementation(() => undefined);
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    const store = new EventStore();
    const queue = new TaskQueue();
    let calls = 0;
    const replyText = rs.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error('temporary');
    });
    addEvent(store);
    const processor = new MessageProcessor({ store, queue, replyText, config: { replyPrefix: '收到：' } });

    processor.enqueue('evt_1');
    await queue.onIdle();
    expect(store.get('evt_1')?.status).toBe('failed');
    processor.enqueue('evt_1');
    await queue.onIdle();
    expect(store.get('evt_1')).toMatchObject({ status: 'processed', attempts: 2 });
    expect(replyText).toHaveBeenCalledTimes(2);
    errorLog.mockRestore();
    log.mockRestore();
  });
});
