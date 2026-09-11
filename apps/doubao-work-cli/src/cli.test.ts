import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
mkdirSync(join(root, '.reports'), { recursive: true });
const scratch = mkdtempSync(join(root, '.reports/doubao-cli-regression-'));
const profile = join(scratch, 'profile.json');
const preload = join(scratch, 'mock.mjs');
const trace = join(scratch, 'requests.jsonl');
writeFileSync(profile, JSON.stringify({ schema_version: 1, headers: { cookie: 'synthetic-test-only' }, query: {},
  completion_query: {}, completion_template: { client_meta: {}, messages: [], option: { general_task_param: {} }, ext: {} } }), { mode: 0o600 });
writeFileSync(preload, `import {appendFileSync} from 'node:fs';
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  appendFileSync(process.env.TEST_TRACE, JSON.stringify({path:new URL(url).pathname,body})+'\\n');
  if (new URL(url).pathname === '/chat/completion') {
    return new Response('event: SSE_ACK\\ndata: {"ack_client_meta":{"conversation_id":9007199254740993}}\\n\\n'+
      'event: STREAM_CHUNK\\ndata: {"message_id":"2","patch_op":[{"patch_value":{"content_block":[{"block_type":10000,"block_id":"b","content":{"text_block":{"text":"OK"}}}]} }]}\\n\\n'+
      'event: SSE_REPLY_END\\ndata: {"end_type":3}\\n\\n', {headers:{'content-type':'text/event-stream'}});
  }
  return new Response(JSON.stringify({status_code:0,downlink_body:{get_conv_info_downlink_body:{conversation_info:{
    conversation_id:'9007199254740993', name:'renamed', status:process.env.TEST_DELETED==='1'?2:1,msg_cursor:'1'}}}}));
};
`);
after(() => rmSync(scratch, { recursive: true, force: true }));
function run(args: string[], deleted = false) {
  writeFileSync(trace, '');
  const result = spawnSync(process.execPath,
    ['--import', join(root, 'node_modules/tsx/dist/loader.mjs'), '--import', preload,
      join(root, 'apps/doubao-work-cli/src/cli.ts'), '--profile', profile, ...args],
    { cwd: scratch, encoding: 'utf8', timeout: 15_000, env: { ...process.env, TEST_TRACE: trace, TEST_DELETED: deleted ? '1' : '0' } });
  assert.ifError(result.error);
  const requests = readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return { ...result, requests };
}
test('P1 regression: root -p executes exactly one completion instead of help', () => {
  const r = run(['-p', 'hello']);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), { session_id: '9007199254740993', text: 'OK', finished: true });
  assert.equal(r.requests.length, 1);
  assert.equal(r.requests[0].body.option.need_create_conversation, true);
});
test('P1 regression: create -p belongs to the child command', () => {
  const r = run(['sessions', 'create', '-p', 'hello']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).text, 'OK');
  assert.equal(r.requests.length, 1);
});
test('P1 regression: send -p continues specified session', () => {
  const r = run(['sessions', 'send', '9007199254740993', '-p', 'hello']);
  assert.equal(r.status, 0, r.stderr);
  const body = r.requests.find((x) => x.path === '/chat/completion').body;
  assert.equal(body.client_meta.conversation_id, '9007199254740993');
  assert.equal(body.option.need_create_conversation, false);
});
test('root --session -p keeps continuation and stream-json output', () => {
  const r = run(['--output-format', 'stream-json', '--session', '9007199254740993', '-p', 'hello']);
  assert.equal(r.status, 0, r.stderr);
  const events = r.stdout.trim().split('\n').map((s) => JSON.parse(s));
  assert.deepEqual(events.map((e) => e.type), ['session', 'text_delta', 'result']);
  assert.equal(events[0].session_id, '9007199254740993');
});
test('invalid mixed root and child prompts make no requests', () => {
  const r = run(['-p', 'root', 'sessions', 'create', '-p', 'child']);
  assert.equal(r.status, 2);
  assert.equal(r.requests.length, 0);
});
test('delete requires explicit --yes and never sends delete_all=true', () => {
  const no = run(['sessions', 'delete', '123']);
  assert.equal(no.status, 2);
  assert.equal(no.requests.length, 0);
  const yes = run(['sessions', 'delete', '123', '--yes'], true);
  assert.equal(yes.status, 0, yes.stderr);
  assert.deepEqual(yes.requests[0].body.uplink_body.batch_delete_user_conversation_uplink_body,
    { conversation_id: ['123'], delete_all: false, conversation_type: 3 });
});
test('text output has session id only on stderr', () => {
  const r = run(['--output-format', 'text', '-p', 'hello']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'OK\n');
  assert.equal(r.stderr, 'session_id=9007199254740993\n');
});
test('invalid command and orphan --session exit 2 without requests', () => {
  for (const args of [['unknown'], ['--session', '123']]) {
    const r = run(args);
    assert.equal(r.status, 2);
    assert.equal(r.requests.length, 0);
  }
});
