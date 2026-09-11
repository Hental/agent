import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client, type Profile } from './client';

const profile: Profile = { schema_version: 1, headers: {}, query: {}, completion_template: {
  client_meta: {}, messages: [], option: { general_task_param: {} }, ext: {},
} };
const ack = 'event: SSE_ACK\ndata: {"ack_client_meta":{"conversation_id":"9007199254740993"}}\n\n';
const response = (text: string) => new Response(text, { headers: { 'content-type': 'text/event-stream' } });

test('EOF before terminal event fails with session ID and no write retry', async () => {
  let calls = 0;
  const client = new Client(profile, 1, async () => { calls++; return response(ack); });
  await assert.rejects(client.send('hello'), /Incomplete.*session=9007199254740993/);
  assert.equal(calls, 1);
});
test('server stream error preserves acknowledged session ID and does not retry', async () => {
  let calls = 0;
  const client = new Client(profile, 1, async () => {
    calls++;
    return response(ack + 'event: STREAM_ERROR\ndata: {"code":123}\n\n');
  });
  await assert.rejects(client.send('hello'), /STREAM_ERROR.*session=9007199254740993/);
  assert.equal(calls, 1);
});
test('deadline aborts an idle stream after ACK and cleans SIGINT listener', async () => {
  const listeners = process.listenerCount('SIGINT');
  let calls = 0;
  let aborted = false;
  const client = new Client(profile, 0.05, async (_url, init) => {
    calls++;
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(ack));
      init?.signal?.addEventListener('abort', () => {
        aborted = true;
        controller.error(new Error('timeout'));
      }, { once: true });
    } }), { headers: { 'content-type': 'text/event-stream' } });
  });
  await assert.rejects(client.send('hello'), /session=9007199254740993/);
  assert.equal(aborted, true);
  assert.equal(calls, 1);
  assert.equal(process.listenerCount('SIGINT'), listeners);
});
test('terminal event closes stream without waiting for server connection EOF', async () => {
  let cancelled = false;
  const client = new Client(profile, 1, async () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(ack + 'event: SSE_REPLY_END\ndata: {"end_type":3}\n\n'));
    },
    cancel() { cancelled = true; },
  }), { headers: { 'content-type': 'text/event-stream' } }));
  const result = await client.send('hello');
  assert.equal(result.finished, true);
  assert.equal(cancelled, true);
});
