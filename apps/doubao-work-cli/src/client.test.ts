import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  Client, ClientError, StreamState, checkResponse, completionBody, dumps, parseJSON,
  savePrivate, sseEvents, wireInteger,
} from './client';
import type { Conversation, Profile, WireObject } from './client';

function profile(): Profile {
  return {
    schema_version: 1, headers: {}, query: {},
    completion_template: {
      client_meta: { bot_id: 'test-bot' }, messages: [{ old: 'prompt' }],
      option: {
        conversation_init_ext: { mode_id: '3' },
        general_task_param: {
          thread_local_message_id: ['old'],
          agent_task_param: { workspace: '/test', local_device_id: '1', runtime_type: 2 },
        },
      },
      ext: {}, user_context: ['old attachment'],
    },
  };
}

async function* chunksOf(parts: (string | Uint8Array)[]): AsyncIterable<Uint8Array> {
  for (const part of parts) yield typeof part === 'string' ? new TextEncoder().encode(part) : part;
}

async function collect(source: AsyncIterable<[string, WireObject]>): Promise<[string, WireObject][]> {
  const events: [string, WireObject][] = [];
  for await (const event of source) events.push(event);
  return events;
}

describe('payload', () => {
  test('new prompt never reuses ids or captured text', () => {
    const original = profile();
    const before = dumps(original);
    const first = completionBody(original, 'hello');
    const second = completionBody(original, 'hello');
    assert.equal(dumps(original), before);
    assert.notEqual(first.messages[0].local_message_id, second.messages[0].local_message_id);
    assert.notEqual(first.option.unique_key, second.option.unique_key);
    assert.equal(first.client_meta.conversation_id, '');
    assert.equal(first.option.need_create_conversation, true);
    assert.deepEqual(first.user_context, []);
    const task = first.option.general_task_param;
    assert.deepEqual(task.thread_local_message_id, [first.messages[0].local_message_id]);
    assert.deepEqual(parseJSON(first.ext.general_task_param), task);
    assert.ok(!dumps(first).includes('old'));
  });

  test('continue preserves large id and integer cursor', () => {
    const result = completionBody(profile(), 'continue', {
      conversation_id: '38441140597324034', last_section_id: '38441140597324035',
      msg_cursor: '9007199254740993', status: 1, name: 't',
    } as Conversation);
    assert.equal(result.client_meta.conversation_id, '38441140597324034');
    assert.equal(result.client_meta.last_message_index, 9007199254740993n);
    assert.equal(result.option.need_create_conversation, false);
    // 64-bit cursor must serialize as a JSON number, not a string.
    assert.ok(dumps(result).includes('"last_message_index":9007199254740993'));
    assert.ok(!dumps(result).includes('"last_message_index":"9007199254740993"'));
  });

  test('different runtime and deleted session rejected', () => {
    assert.throws(
      () => completionBody(profile(), 'hello', { conversation_id: '123', status: 2, name: 'x' } as Conversation),
      ClientError);
    assert.throws(
      () => completionBody(profile(), 'hello', {
        conversation_id: '123', status: 1, name: 'x',
        extra: dumps({ agent_task_param: dumps({ workspace: '/other' }) }),
      } as Conversation),
      ClientError);
  });

  test('empty prompt', () => {
    assert.throws(() => completionBody(profile(), '  '), ClientError);
  });

  test('private file atomic permissions', async () => {
    const artifacts = join(dirname(fileURLToPath(import.meta.url)), '../../../.reports/doubao-work-cli');
    await mkdir(artifacts, { recursive: true });
    const dir = await mkdtemp(join(artifacts, 'test-tmp-'));
    try {
      const target = join(dir, 'profile.json');
      await savePrivate(target, { secret: 'test-only' });
      assert.equal((await stat(target)).mode & 0o777, 0o600);
      await savePrivate(target, { secret: 'rotated' });
      assert.deepEqual(parseJSON(await readFile(target, 'utf8')), { secret: 'rotated' });
      assert.equal((await readdir(dir)).length, 1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('json precision', () => {
  test('64-bit integers stay exact JSON numbers', () => {
    const value = parseJSON('{"big":9007199254740993,"neg":-9007199254740993,"small":42,"float":1.5,"s":"38441140597324034"}') as WireObject;
    assert.equal(value.big, 9007199254740993n);
    assert.equal(value.neg, -9007199254740993n);
    assert.equal(value.small, 42);
    assert.equal(value.float, 1.5);
    assert.equal(value.s, '38441140597324034');
    assert.equal(dumps(value), '{"big":9007199254740993,"neg":-9007199254740993,"small":42,"float":1.5,"s":"38441140597324034"}');
  });

  test('wireInteger rejects unsafe numbers and non-decimal strings', () => {
    assert.equal(wireInteger('9007199254740993'), 9007199254740993n);
    assert.equal(wireInteger(42), 42n);
    assert.throws(() => wireInteger(9007199254740993), ClientError);
    assert.throws(() => wireInteger('12x3'), ClientError);
  });
});

describe('stream', () => {
  test('utf8, crlf and multiline sse', async () => {
    assert.deepEqual(
      await collect(sseEvents(chunksOf(['event: TEST\r\ndata: {\r\ndata: "text":"你好"}\r\n\r\n']))),
      [['TEST', { text: '你好' }]]);
  });

  test('network chunks may split utf8 characters and crlf pairs', async () => {
    const bytes = new TextEncoder().encode('event: TEST\r\ndata: {"text":"你好"}\r\n\r\n');
    // Split inside the multi-byte character 你 (E4 BD A0) and between \r and \n.
    for (const at of [bytes.indexOf(0xe4) + 1, bytes.indexOf(0xe4) + 2]) {
      assert.deepEqual(
        await collect(sseEvents(chunksOf([bytes.subarray(0, at), bytes.subarray(at)]))),
        [['TEST', { text: '你好' }]]);
    }
    assert.deepEqual(
      await collect(sseEvents(chunksOf(['event: TEST\r', '\ndata: {}\r', '\n\r', '\n']))),
      [['TEST', {}]]);
  });

  test('truncated or invalid sse fails', async () => {
    for (const source of ['event: TEST\ndata: {}\n', 'data: not-json\n\n']) {
      await assert.rejects(collect(sseEvents(chunksOf([source]))), ClientError);
    }
  });

  const chunk = (text: string, parent = '', patchType = 1): WireObject => ({
    message_id: '123',
    patch_op: [{ patch_object: 1, patch_value: { content_block: [{ block_type: 10000, block_id: 'block', parent_id: parent, patch_type: patchType, content: { text_block: { text } } }] } }],
  });

  test('deltas, no reasoning, and terminal end', () => {
    const state = new StreamState();
    state.apply('SSE_ACK', { ack_client_meta: { conversation_id: 9007199254740993n } });
    state.apply('STREAM_CHUNK', chunk('private reasoning', 'thinking-parent'));
    state.apply('CHUNK_DELTA', { text: 'also reasoning' });
    state.apply('STREAM_CHUNK', chunk('CLI_'));
    state.apply('STREAM_CHUNK', chunk('OK'));
    assert.equal(state.text(), 'CLI_OK');
    state.apply('SSE_REPLY_END', { end_type: 1 });
    assert.equal(state.finished, false);
    state.apply('SSE_REPLY_END', { end_type: 3 });
    assert.equal(state.finished, true);
    assert.equal(state.session, '9007199254740993');
  });

  test('snapshot replaces not duplicates', () => {
    const state = new StreamState('1');
    state.apply('STREAM_CHUNK', chunk('part'));
    state.apply('STREAM_CHUNK', chunk('complete', '', 2));
    assert.equal(state.text(), 'complete');
    assert.throws(() => state.apply('STREAM_ERROR', { code: 123 }), ClientError);
  });
});

describe('api', () => {
  test('business error even on http success', () => {
    for (const payload of [{ status_code: 123 }, {}, []]) {
      assert.throws(() => checkResponse(payload), ClientError);
    }
    assert.deepEqual(checkResponse({ status_code: 0, downlink_body: { a: 1 } }), { a: 1 });
  });

  test('cursor is integer without precision loss', async () => {
    const client = new Client({} as Profile);
    const calls: unknown[][] = [];
    client.im = (async (...args: unknown[]) => { calls.push(args); return {}; }) as Client['im'];
    await client.listPage(20, '9007199254740993');
    const uplink = calls[0]?.[3] as WireObject;
    assert.equal(uplink.conv_version, 9007199254740993n);
    assert.equal(uplink.direction, 1);
    assert.equal(uplink.option.pc_pin_query_type, 1);
    // 64-bit cursor must go on the wire as a JSON number, not a string.
    assert.ok(dumps(uplink).includes('"conv_version":9007199254740993'));
    assert.ok(!dumps(uplink).includes('"conv_version":"9007199254740993"'));
  });

  test('pin group transition can keep same cursor', async () => {
    const client = new Client({} as Profile);
    const pages: WireObject[] = [
      { cells: [], has_more: true, next_conv_version: '0', extra: { pc_pin_query_type: 1 } },
      { cells: [], has_more: false, next_conv_version: '0', extra: { pc_pin_query_type: 1 } },
    ];
    const calls: unknown[][] = [];
    client.listPage = (async (...args: unknown[]) => { calls.push(args); return pages[calls.length - 1]; }) as Client['listPage'];
    assert.equal((await client.sessions(20, '0', true)).has_more, false);
    assert.equal(calls[0]?.[2], 0);
    assert.equal(calls[1]?.[2], 1);
  });

  test('message history stops even with next_index', async () => {
    const client = new Client({} as Profile);
    let count = 0;
    client.messages = (async () => {
      count += 1;
      return { messages: [], has_more: false, next_index: '42' };
    }) as Client['messages'];
    assert.equal((await client.history('123', 20, '0', 2, true)).has_more, false);
    assert.equal(count, 1);
  });

  test('pagination dedupe and stop on has_more false', async () => {
    const client = new Client({} as Profile);
    const cell = (sid: string): WireObject => ({ conversation: { conversation_id: sid, name: 'test' } });
    const pages: WireObject[] = [
      { cells: [cell('1')], has_more: true, next_conv_version: '2' },
      { cells: [cell('1'), cell('2')], has_more: false, next_conv_version: '3' },
    ];
    let count = 0;
    client.listPage = (async () => { count += 1; return pages[count - 1]; }) as Client['listPage'];
    const data = await client.sessions(20, '0', true);
    assert.equal(data.sessions.length, 2);
    assert.equal(count, 2);
    assert.equal(data.has_more, false);
  });

  test('repeated cursor fails', async () => {
    const client = new Client({} as Profile);
    client.listPage = (async () => ({ has_more: true, next_conv_version: '0' })) as Client['listPage'];
    await assert.rejects(client.sessions(20, '0', true), ClientError);
  });

  test('delete only one session and verify', async () => {
    const client = new Client({} as Profile);
    const calls: unknown[][] = [];
    client.im = (async (...args: unknown[]) => { calls.push(args); return {}; }) as Client['im'];
    client.info = (async () => ({ status: 2 })) as unknown as Client['info'];
    assert.equal((await client.delete('123')).deleted, true);
    const uplink = calls[0]?.[3] as WireObject;
    assert.deepEqual(uplink.conversation_id, ['123']);
    assert.equal(uplink.delete_all, false);
  });
});
