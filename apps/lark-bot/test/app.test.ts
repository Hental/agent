import { describe, expect, it, rs } from '@rstest/core';
import { createApp } from '../src/app.js';
import { EventStore } from '../src/event-store.js';
import { CardActionStore } from '../src/card-action-store.js';
import type { EnqueueResult } from '../src/message-processor.js';

function dependencies() {
  const store = new EventStore();
  return {
    store,
    cardActions: new CardActionStore(),
    enqueueEvent: rs.fn<(eventId: string) => EnqueueResult>(() => ({ kind: 'not_found' })),
    sendText: rs.fn(async () => ({ data: { message_id: 'om_text' } })),
    sendCard: rs.fn(async () => ({ data: { message_id: 'om_card' } })),
    queueStats: () => ({ active: 0, pending: 0 }),
  };
}

describe('Hono app', () => {
  it('returns health and validates event limit', async () => {
    const app = createApp(dependencies());
    const health = await app.request('/health');
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ ok: true, service: 'lark-bot' });
    expect((await app.request('/events?limit=0')).status).toBe(400);
  });

  it('lists events and requests processing', async () => {
    const deps = dependencies();
    deps.store.add({
      id: 'evt_1', messageId: 'om_1', chatId: 'oc_1', senderId: 'ou_1', messageType: 'text', text: 'hi',
    });
    deps.enqueueEvent.mockReturnValue({ kind: 'accepted', event: deps.store.get('evt_1')! });
    const app = createApp(deps);

    const list = await app.request('/events?limit=1');
    expect((await list.json() as { events: unknown[] }).events).toHaveLength(1);
    const process = await app.request('/events/evt_1/process', { method: 'POST' });
    expect(process.status).toBe(202);
    expect(deps.enqueueEvent).toHaveBeenCalledWith('evt_1');
  });

  it('sends text and a two-button test card through injected services', async () => {
    const deps = dependencies();
    const app = createApp(deps);
    const message = await app.request('/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ receiveId: 'oc_test', text: 'hello' }),
    });
    expect(message.status).toBe(200);
    expect(deps.sendText).toHaveBeenCalledWith({
      receiveId: 'oc_test', receiveIdType: 'chat_id', text: 'hello',
    });

    const card = await app.request('/cards/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ receiveId: 'ou_test', receiveIdType: 'open_id' }),
    });
    expect(card.status).toBe(200);
    expect(deps.sendCard).toHaveBeenCalledWith(
      'ou_test', 'open_id', expect.objectContaining({ schema: '2.0' }),
    );

    const booking = await app.request('/cards/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        receiveId: 'liutao.fe@bytedance.com', receiveIdType: 'email', requestId: 'req_1',
        className: '燃脂训练', gymName: '超级猩猩', startTime: '18:40', endTime: '19:40', onlineCost: 2900,
      }),
    });
    expect(booking.status).toBe(200);
    expect(deps.sendCard).toHaveBeenLastCalledWith(
      'liutao.fe@bytedance.com', 'email', expect.objectContaining({ schema: '2.0' }),
    );

    const courseList = await app.request('/cards/course-list', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        receiveId: 'liutao.fe@bytedance.com', receiveIdType: 'email', requestId: 'req_list',
        date: '2026-08-15', gymName: '天府三街全能店',
        courses: [{
          scheduleId: 's1', className: '燃脂训练', coachName: '教练',
          startTime: '18:40', endTime: '19:40', onlineCost: 2900,
        }],
      }),
    });
    expect(courseList.status).toBe(200);
    expect(deps.sendCard).toHaveBeenLastCalledWith(
      'liutao.fe@bytedance.com', 'email', expect.objectContaining({ schema: '2.0' }),
    );
  });

  it('lists card actions by request id', async () => {
    const deps = dependencies();
    deps.cardActions.add({ id: 'evt_card', requestId: 'req_1', action: 'confirm_order', operatorId: 'ou_1' });
    const app = createApp(deps);
    const response = await app.request('/card-actions?requestId=req_1');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, actions: [{ requestId: 'req_1', action: 'confirm_order' }] });
  });
});
