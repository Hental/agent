import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { createRequest } from '../src/request.js';
import { saveRequest, readRequest } from '../src/state.js';
import { ACTION_NAME, DEFAULT_TARGET, PLUGIN_ID } from '../src/defaults.js';

test('loopback callback service requires gateway authentication and returns a terminal generic card', async t => {
  const root = resolve(import.meta.dirname, '../../../.reports/botmux-card-confirmation-test');
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(`${root}/service-`);
  const token = 'isolated-test-gateway-token';
  const url = pathToFileURL(resolve(import.meta.dirname, '../src/service/server.js')).href;
  const code = `import { once } from 'node:events'; const {server} = await import(${JSON.stringify(url)}); if (!server.listening) await once(server, 'listening'); console.log(JSON.stringify({port:server.address().port}));`;
  const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], {
    cwd: import.meta.dirname,
    env: { ...process.env, PORT: '0', BOTMUX_PLUGIN_CARD_ACTION_TOKEN: token, CARD_CONFIRMATION_STATE_DIR: directory },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let errorOutput = '';
  child.stderr!.on('data', chunk => { errorOutput += chunk; });
  t.after(async () => {
    if (child.exitCode === null) { const exit = once(child, 'exit'); child.kill('SIGTERM'); await exit; }
    rmSync(directory, { recursive: true, force: true });
  });
  const port = await new Promise<number>((resolvePort, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Service startup timeout')), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.stdout!.on('data', chunk => {
      output += chunk;
      if (output.includes('\n')) { clearTimeout(timer); resolvePort(JSON.parse(output.split('\n')[0]!).port as number); }
    });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Service exited: ${code}`)); });
  });
  const endpoint = `http://127.0.0.1:${port}`;
  const health = await (await fetch(endpoint + '/health')).json() as { pluginId: string };
  assert.equal(health.pluginId, PLUGIN_ID);
  const request = {
    ...createRequest({ title: '审批示例', summary: 'Isolated local test', testOnly: true, expiresAt: new Date(Date.now() + 60000).toISOString() }, randomUUID()),
    status: 'pending' as const, messageId: 'om_local_test',
  };
  saveRequest(directory, request);
  const event = {
    schemaVersion: 1, actionName: ACTION_NAME, larkAppId: DEFAULT_TARGET.larkAppId,
    eventId: 'isolated-local-event', operator: { open_id: DEFAULT_TARGET.operatorId },
    context: { open_chat_id: DEFAULT_TARGET.chatId, open_message_id: request.messageId },
    action: { value: { action: ACTION_NAME, requestId: request.id, nonce: request.nonce, optionId: 'reject' } },
  };
  const unauthorized = await fetch(endpoint + '/card-action', { method: 'POST', body: JSON.stringify(event) });
  assert.equal(unauthorized.status, 401);
  assert.equal(readRequest(directory, request.id).status, 'pending');
  const headers = { authorization: `Bearer ${token}` };
  await t.test('unknown routes and unsupported methods return the JSON 404 contract', async () => {
    for (const [path, method] of [['/missing', 'GET'], ['/card-action', 'GET'], ['/health', 'POST']]) {
      const response = await fetch(endpoint + path, { method });
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: 'Not found' });
    }
  });
  await t.test('malformed callbacks return a warning without leaking the body or modifying state', async () => {
    for (const body of ['sensitive-json-marker{', '{}', ' '.repeat(65536)]) {
      const response = await fetch(endpoint + '/card-action', { method: 'POST', headers, body });
      assert.equal(response.status, 200);
      const ack = await response.json() as { schemaVersion: number; ack: { toast: { type: string }; card?: unknown } };
      assert.equal(ack.schemaVersion, 1);
      assert.equal(ack.ack.toast.type, 'warning');
      assert.equal(ack.ack.card, undefined);
    }
    assert.equal(readRequest(directory, request.id).status, 'pending');
    assert.ok(!errorOutput.includes('sensitive-json-marker'));
  });
  await t.test('authentication precedes the byte limit and oversized bodies return JSON 413', async () => {
    const oversized = '你'.repeat(21846); // 65,538 UTF-8 bytes, despite fewer JS characters.
    const unauthorized = await fetch(endpoint + '/card-action', { method: 'POST', body: oversized });
    assert.equal(unauthorized.status, 401);
    const response = await fetch(endpoint + '/card-action', { method: 'POST', headers, body: oversized });
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: 'Payload too large' });
    // No Content-Length: exercise the stream path, not just the header check.
    const streamed = await new Promise<{ status: number | undefined; body: string }>((resolveResponse, reject) => {
      const req = httpRequest(endpoint + '/card-action', { method: 'POST', headers }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.once('end', () => resolveResponse({ status: res.statusCode, body }));
        res.once('error', reject);
      });
      req.once('error', reject);
      req.setTimeout(3000, () => req.destroy(new Error('Streaming callback timed out')));
      req.write('x'.repeat(32768));
      req.end('x'.repeat(32769));
    });
    assert.equal(streamed.status, 413);
    assert.deepEqual(JSON.parse(streamed.body), { error: 'Payload too large' });
    assert.equal(readRequest(directory, request.id).status, 'pending');
  });
  const response = await fetch(endpoint + '/card-action', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(event) });
  const result = await response.json() as { schemaVersion: number; ack: { card: { header: { title: { content: string } }; body: { elements: unknown[] } } } };
  assert.equal(response.status, 200);
  assert.equal(result.schemaVersion, 1);
  assert.equal(readRequest(directory, request.id).status, 'rejected');
  assert.equal(result.ack.card.header.title.content, '审批示例 · 测试');
  assert.ok(!JSON.stringify(result.ack.card).includes('"tag":"button"'));
});
