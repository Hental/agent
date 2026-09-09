import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
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
  const response = await fetch(endpoint + '/card-action', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(event) });
  const result = await response.json() as { schemaVersion: number; ack: { card: { header: { title: { content: string } }; body: { elements: unknown[] } } } };
  assert.equal(response.status, 200);
  assert.equal(result.schemaVersion, 1);
  assert.equal(readRequest(directory, request.id).status, 'rejected');
  assert.equal(result.ack.card.header.title.content, '审批示例 · 测试');
  assert.ok(!JSON.stringify(result.ack.card).includes('"tag":"button"'));
});
