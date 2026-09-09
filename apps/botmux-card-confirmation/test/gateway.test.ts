import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '../src/client.js';
import { readRequest, decide } from '../src/state.js';
import { DEFAULT_TARGET, PLUGIN_ID, ACTION_NAME } from '../src/defaults.js';
import type { BotmuxRunner, CardActionValue, ConfirmationInput } from '../src/types.js';

interface RenderedButton { behaviors: Array<{ type: string; value: CardActionValue }> }
interface RenderedColumnSet { tag: string; columns: Array<{ elements: RenderedButton[] }> }
interface RenderedCard { body: { elements: Array<{ tag: string } & Partial<RenderedColumnSet>> } }

function fixture(t: test.TestContext, overrides: Partial<{ run: BotmuxRunner; checkService: () => Promise<unknown> }> = {}) {
  const root = resolve(import.meta.dirname, '../../../.reports/botmux-card-confirmation-test');
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(`${root}/gateway-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const sessionId = randomUUID();
  const calls: string[][] = [];
  const run: BotmuxRunner = async args => {
    calls.push(args);
    if (args[0] === 'history') return { sessionId, chatId: DEFAULT_TARGET.chatId };
    return { success: true, sessionId, messageId: 'om_gateway_test' };
  };
  const client = createClient({ directory, run, checkService: async () => ({ ok: true }), ...overrides });
  return { directory, sessionId, calls, client };
}
const input = (): ConfirmationInput => ({ title: '通用确认', summary: 'Review this action', expiresAt: new Date(Date.now() + 60000).toISOString() });

test('confirmation goes through Botmux and a bound callback is persisted and patched through the same gateway', async t => {
  const { directory, sessionId, calls, client } = fixture(t);
  const sent = await client.sendConfirmation(input(), sessionId);
  const send = calls.find(args => args[0] === 'send')!;
  assert.equal(send[send.indexOf('--plugin-card-action') + 1], PLUGIN_ID);
  const card = JSON.parse(readFileSync(send[send.indexOf('--card-file') + 1]!, 'utf8')) as RenderedCard;
  const value = card.body.elements.find(e => e.tag === 'column_set')!.columns![0]!.elements[0]!.behaviors[0]!.value;
  assert.equal(value.action, ACTION_NAME);
  decide(directory, {
    schemaVersion: 1, actionName: ACTION_NAME, larkAppId: DEFAULT_TARGET.larkAppId,
    eventId: 'local-test-event', operator: { open_id: DEFAULT_TARGET.operatorId },
    context: { open_chat_id: DEFAULT_TARGET.chatId, open_message_id: sent.messageId }, action: { value },
  });
  const status = await client.status(sent.requestId);
  assert.equal(status.status, 'confirmed');
  assert.equal(status.cardPatched, true);
  assert.equal('nonce' in status, false);
  assert.deepEqual(calls.at(-1)!.slice(0, 2), ['card', 'patch']);
  await client.invalidate(sent.requestId);
  assert.equal(readRequest(directory, sent.requestId).status, 'confirmed');
});

test('display cards use Botmux without callback registration; arbitrary callbacks are rejected', async t => {
  const { client, calls, sessionId } = fixture(t);
  const card: Record<string, unknown> = { schema: '2.0', body: { elements: [{ tag: 'markdown', content: '[支付链接](https://example.com/payment)' }] } };
  await client.sendCard(card, sessionId);
  assert.equal(calls.at(-1)![0], 'send');
  assert.ok(!calls.at(-1)!.includes('--plugin-card-action'));
  (card.body as { elements: unknown[] }).elements.push({ tag: 'button', behaviors: [{ type: 'callback', value: { action: 'unknown' } }] });
  await assert.rejects(client.sendCard(card, sessionId), /registered options/);
  assert.equal(calls.length, 1);
});

test('mismatched recipient and unavailable callback service cannot send a confirmation', async t => {
  let sends = 0;
  const { client, sessionId } = fixture(t, {
    run: async args => {
      if (args[0] === 'send') sends++;
      return { sessionId: args[2], chatId: 'oc_wrong' };
    },
  });
  await assert.rejects(client.sendConfirmation(input(), sessionId), /recipient/);
  assert.equal(sends, 0);
  const second = fixture(t, { checkService: async () => { throw new Error('offline'); } });
  await assert.rejects(second.client.sendConfirmation(input(), second.sessionId), /offline/);
  assert.equal(second.calls.filter(a => a[0] === 'send').length, 0);
});

test('uncertain sends remain send_unknown and are not automatically retried', async t => {
  let sends = 0;
  const { client, directory, sessionId } = fixture(t, {
    run: async args => {
      if (args[0] === 'history') return { sessionId: args[2], chatId: DEFAULT_TARGET.chatId };
      sends++;
      throw new Error('transport timeout');
    },
  });
  await assert.rejects(client.sendConfirmation(input(), sessionId), /Send result unknown/);
  assert.equal(sends, 1);
  const [id] = readdirSync(directory);
  assert.equal(readRequest(directory, id!).status, 'send_unknown');
});

test('an empty messageId from Botmux is not a usable send result', async t => {
  let sends = 0;
  const { client, directory, sessionId } = fixture(t, {
    run: async args => {
      if (args[0] === 'history') return { sessionId: args[2], chatId: DEFAULT_TARGET.chatId };
      sends++;
      return { success: true, sessionId: args[2], messageId: '' };
    },
  });
  await assert.rejects(client.sendConfirmation(input(), sessionId), /Send result unknown/);
  assert.equal(sends, 1, 'an unverified confirmation is not retried');
  const [id] = readdirSync(directory);
  const stored = readRequest(directory, id!);
  assert.equal(stored.status, 'send_unknown');
  assert.equal(stored.messageId, null, 'no empty message ID may be bound to the request');
});

test('display cards reject an empty messageId without retrying the send', async t => {
  let sends = 0;
  const { client, sessionId } = fixture(t, {
    run: async args => {
      if (args[0] === 'history') return { sessionId: args[2], chatId: DEFAULT_TARGET.chatId };
      sends++;
      return { success: true, sessionId: args[2], messageId: '' };
    },
  });
  const card = { schema: '2.0', body: { elements: [{ tag: 'markdown', content: '[支付链接](https://example.com/payment)' }] } };
  await assert.rejects(client.sendCard(card, sessionId), /Send result not verified/);
  assert.equal(sends, 1);
});
