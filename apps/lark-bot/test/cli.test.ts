import { describe, expect, it, rs } from '@rstest/core';
import { parseCliArgs } from '../cli/args.js';
import { BotHttpClient } from '../cli/client.js';

describe('CLI', () => {
  it('parses all commands and environment base URL', () => {
    expect(parseCliArgs(['health'], { LARK_BOT_URL: 'http://bot:3000/' })).toEqual({
      name: 'health', baseUrl: 'http://bot:3000',
    });
    expect(parseCliArgs(['events', '--limit', '5'])).toMatchObject({ name: 'events', limit: 5 });
    expect(parseCliArgs(['card-actions', '--request-id', 'req_1'])).toMatchObject({ name: 'card-actions', requestId: 'req_1' });
    expect(parseCliArgs(['process', 'evt_1'])).toMatchObject({ name: 'process', eventId: 'evt_1' });
    expect(parseCliArgs(['send-card', '--receive-id', 'ou_1', '--receive-id-type', 'open_id'])).toMatchObject({
      name: 'send-card', receiveId: 'ou_1', receiveIdType: 'open_id',
    });
    expect(parseCliArgs(['send', '--receive-id', 'oc_1', '--text', 'hi'])).toMatchObject({
      name: 'send', receiveId: 'oc_1', receiveIdType: 'chat_id', text: 'hi',
    });
    expect(parseCliArgs([
      'send-booking-card', '--email', 'user@example.com', '--request-id', 'req_1',
      '--class-name', '课程', '--gym-name', '门店', '--start-time', '18:40', '--end-time', '19:40', '--online-cost', '2900',
    ])).toMatchObject({ name: 'send-booking-card', receiveIdType: 'email', onlineCost: 2900 });
    expect(parseCliArgs([
      'send-course-list-card', '--email', 'user@example.com', '--request-id', 'req_list',
      '--date', '2026-08-15', '--gym-name', '门店', '--courses-json', '[{"scheduleId":"s1"}]',
    ])).toMatchObject({ name: 'send-course-list-card', receiveIdType: 'email', courses: [{ scheduleId: 's1' }] });
  });

  it('rejects invalid arguments', () => {
    expect(() => parseCliArgs(['events', '--limit', '101'])).toThrow('--limit');
    expect(() => parseCliArgs(['send'])).toThrow('--receive-id');
  });

  it('uses HTTP instead of importing the Feishu SDK', async () => {
    const fetchMock = rs.fn(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    const client = new BotHttpClient('http://localhost:3000', fetchMock as typeof fetch);
    await client.process('evt/1');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/events/evt%2F1/process',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
