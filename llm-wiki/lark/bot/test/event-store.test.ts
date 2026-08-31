import { describe, expect, it } from '@rstest/core';
import { EventStore, safeError } from '../src/event-store.js';

function input(id: string) {
  return {
    id,
    messageId: `om_${id}`,
    chatId: 'oc_test',
    senderId: 'ou_test',
    messageType: 'text',
    text: id,
  };
}

describe('EventStore', () => {
  it('deduplicates IDs and enforces capacity', () => {
    const store = new EventStore(2);
    expect(store.add(input('1')).created).toBe(true);
    expect(store.add(input('1')).created).toBe(false);
    store.markProcessed('1');
    store.add(input('2'));
    store.add(input('3'));
    expect(store.size).toBe(2);
    expect(store.get('1')).toBeUndefined();
  });

  it('supports pending, processing, failed retry, and processed transitions', () => {
    const store = new EventStore();
    store.add(input('1'));
    expect(store.claim('1').kind).toBe('claimed');
    expect(store.claim('1').kind).toBe('processing');
    expect(store.markFailed('1', new Error('temporary'))?.status).toBe('failed');
    expect(store.claim('1').kind).toBe('claimed');
    expect(store.markProcessed('1')?.status).toBe('processed');
    expect(store.claim('1').kind).toBe('processed');
    expect(store.get('1')?.attempts).toBe(2);
  });

  it('stores only a bounded error summary', () => {
    expect(safeError(new Error(`secret\n${'x'.repeat(400)}`))).toHaveLength(300);
  });
});
