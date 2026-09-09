// Smoke tests against the real Rspack build output, exercised from a copy
// under .reports so nothing here depends on src/ or node_modules at runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const appDir = resolve(import.meta.dirname, '..');
const workspaceRoot = resolve(appDir, '../..');
const reportsRoot = resolve(workspaceRoot, '.reports/botmux-card-confirmation-ts');
const distDir = resolve(appDir, 'dist');
const copyDir = resolve(reportsRoot, 'dist-copy');
const expectedStateDir = resolve(workspaceRoot, '.reports/botmux-card-confirmation');

test.before(() => {
  mkdirSync(reportsRoot, { recursive: true });
  rmSync(copyDir, { recursive: true, force: true });
  cpSync(distDir, copyDir, { recursive: true });
});
test.after(() => rmSync(copyDir, { recursive: true, force: true }));

test('dist layout contains all runnable entry points and manifests', () => {
  for (const file of ['client.js', 'confirm.js', 'run-local.js', 'finish-test.js',
    'service/index.js', 'service/server.js', 'runtime.json', 'card-actions/index.json', 'package.json']) {
    assert.ok(existsSync(join(copyDir, file)), `missing dist/${file}`);
  }
  assert.equal(existsSync(join(copyDir, 'node_modules')), false, 'dist must not depend on node_modules');
  const runtime = JSON.parse(readFileSync(join(copyDir, 'runtime.json'), 'utf8'));
  assert.equal(runtime.stateDir, expectedStateDir, 'runtime.json must point at the project-root state dir');
  const manifest = JSON.parse(readFileSync(join(copyDir, 'card-actions/index.json'), 'utf8'));
  assert.deepEqual(manifest, { schemaVersion: 1, actions: ['card_confirmation_decide'], endpoint: '/card-action' });
});

test('bundled client resolves the default state path without writing anything', async () => {
  const clientModule = await import(join(copyDir, 'client.js'));
  assert.equal(clientModule.stateDir, expectedStateDir);
  assert.equal(typeof clientModule.createClient, 'function');
  assert.equal(typeof clientModule.health, 'function');
  assert.equal(clientModule.DEFAULT_TARGET.larkAppId.startsWith('cli_'), true);
});

test('a copied bundle missing runtime.json fails loudly instead of picking a new state dir', async () => {
  const damagedDir = resolve(reportsRoot, 'dist-damaged');
  rmSync(damagedDir, { recursive: true, force: true });
  cpSync(copyDir, damagedDir, { recursive: true });
  rmSync(join(damagedDir, 'runtime.json'));
  try {
    await assert.rejects(
      () => import(join(damagedDir, 'client.js')),
      /missing dist\/runtime\.json/,
    );
  } finally {
    rmSync(damagedDir, { recursive: true, force: true });
  }
});

test('service manifest loads and exposes the Botmux manual service contract', async () => {
  const serviceModule = await import(join(copyDir, 'service/index.js'));
  const manifest = serviceModule.default;
  assert.equal(manifest.mode, 'manual');
  assert.equal(manifest.port, 19361);
  assert.equal(manifest.pm2.script, './service/server.js');
  assert.equal(manifest.pm2.env.CARD_CONFIRMATION_STATE_DIR, expectedStateDir);
  assert.equal(manifest.urls().healthUrl, 'http://127.0.0.1:19361/health');
});

test('CLI prints usage on help and exits non-zero on unknown commands', async () => {
  const { execFile } = await import('node:child_process');
  const execFileAsync = (await import('node:util')).promisify(execFile);
  const help = await execFileAsync(process.execPath, [join(copyDir, 'confirm.js'), 'help'], { encoding: 'utf8' });
  assert.ok(help.stdout.includes('Commands: send <request.json>'));
  await assert.rejects(
    execFileAsync(process.execPath, [join(copyDir, 'confirm.js'), 'bogus'], { encoding: 'utf8' }),
    (error) => error.code === 1,
  );
});

test('bundled service answers health and rejects unauthenticated callbacks in an isolated node subprocess', async (t) => {
  const stateDir = mkdtempSync(join(reportsRoot, 'smoke-state-'));
  const token = 'smoke-test-gateway-token';
  const code = `import { once } from 'node:events';
const { server } = await import(${JSON.stringify(join(copyDir, 'service/server.js'))});
if (!server.listening) await once(server, 'listening');
console.log(JSON.stringify({ port: server.address().port }));`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, PORT: '0', BOTMUX_PLUGIN_CARD_ACTION_TOKEN: token, CARD_CONFIRMATION_STATE_DIR: stateDir },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) { const exit = once(child, 'exit'); child.kill('SIGTERM'); await exit; }
    rmSync(stateDir, { recursive: true, force: true });
  });
  const port = await new Promise((resolvePort, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('bundled service startup timeout')), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.stdout.on('data', chunk => {
      output += chunk;
      if (output.includes('\n')) { clearTimeout(timer); resolvePort(JSON.parse(output.split('\n')[0]).port); }
    });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`bundled service exited: ${code}`)); });
  });
  const endpoint = `http://127.0.0.1:${port}`;
  const health = await (await fetch(endpoint + '/health')).json();
  assert.equal(health.ok, true);
  assert.equal(health.pluginId, 'card-confirmation');
  assert.equal(typeof health.pid, 'number');

  // Seed a pending request exactly as the callback service would find it.
  const requestId = randomUUID();
  const nonce = randomBytes(24).toString('hex');
  mkdirSync(join(stateDir, requestId), { recursive: true });
  writeFileSync(join(stateDir, requestId, 'request.json'), JSON.stringify({
    larkAppId: 'cli_aa149e4ed9389cb5', chatId: 'oc_558e971f498438280d88ec1372df95c2',
    operatorId: 'ou_0de0382daf0b601518c6eb63486207d3', id: requestId, nonce,
    sessionId: randomUUID(), title: '操作确认', summary: 'Smoke test',
    options: [{ id: 'confirm', label: '确认', result: 'confirmed', type: 'primary', payload: null, resultText: null }],
    context: null, snapshotPath: null, testOnly: true,
    expiresAt: new Date(Date.now() + 60000).toISOString(), createdAt: new Date().toISOString(),
    status: 'pending', messageId: 'om_smoke',
  }));
  const event = {
    schemaVersion: 1, actionName: 'card_confirmation_decide', larkAppId: 'cli_aa149e4ed9389cb5',
    eventId: 'smoke-event', operator: { open_id: 'ou_0de0382daf0b601518c6eb63486207d3' },
    context: { open_chat_id: 'oc_558e971f498438280d88ec1372df95c2', open_message_id: 'om_smoke' },
    action: { value: { action: 'card_confirmation_decide', requestId, nonce, optionId: 'confirm' } },
  };
  const noAuth = await fetch(endpoint + '/card-action', { method: 'POST', body: JSON.stringify(event) });
  assert.equal(noAuth.status, 401);
  const wrongAuth = await fetch(endpoint + '/card-action', { method: 'POST', headers: { authorization: 'Bearer wrong-token' }, body: JSON.stringify(event) });
  assert.equal(wrongAuth.status, 401);
  assert.equal(JSON.parse(readFileSync(join(stateDir, requestId, 'request.json'), 'utf8')).status, 'pending');
  const accepted = await fetch(endpoint + '/card-action', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(event) });
  const ack = await accepted.json();
  assert.equal(accepted.status, 200);
  assert.equal(ack.schemaVersion, 1);
  assert.equal(JSON.parse(readFileSync(join(stateDir, requestId, 'request.json'), 'utf8')).status, 'confirmed');
  assert.ok(!JSON.stringify(ack.ack.card).includes('"tag":"button"'));
});
