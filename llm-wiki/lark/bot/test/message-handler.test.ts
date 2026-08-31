import { describe, expect, it, rs } from '@rstest/core';
import { EventStore } from '../src/event-store.js';
import { createMessageHandler, parseTextContent } from '../src/message-handler.js';

describe('message event handling', () => {
  it('parses Feishu text content safely', () => {
    expect(parseTextContent('{"text":" hello "}')).toBe('hello');
    expect(parseTextContent('{bad json')).toBe('');
  });

  it('stores and enqueues a text event once without awaiting processing', () => {
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    const store = new EventStore();
    const enqueue = rs.fn(() => ({ kind: 'accepted' as const, event: store.get('evt_1')! }));
    const handler = createMessageHandler({ store, processor: { enqueue }, autoReply: true });
    const event = {
      event_id: 'evt_1',
      message: {
        message_id: 'om_1',
        chat_id: 'oc_1',
        message_type: 'text',
        content: '{"text":"ping"}',
      },
    };

    handler(event);
    handler(event);
    expect(store.get('evt_1')?.status).toBe('pending');
    expect(enqueue).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
