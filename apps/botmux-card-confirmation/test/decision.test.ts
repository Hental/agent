import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { saveRequest, readRequest, decide } from '../src/state.js';
import { DEFAULT_TARGET as TARGET, ACTION_NAME } from '../src/defaults.js';
import { createRequest } from '../src/request.js';
import { renderCard } from '../src/card.js';
import type { CardActionEvent, CardActionValue, ConfirmationInput, ConfirmationRequest, StoredOption } from '../src/types.js';

interface RenderedButton { behaviors: Array<{ type: string; value: CardActionValue }> }
interface RenderedColumnSet { tag: string; columns: Array<{ elements: RenderedButton[] }> }
interface RenderedCard { body: { elements: Array<{ tag: string } & Partial<RenderedColumnSet>> } }

function fixture(t: test.TestContext) {
  const root = resolve(import.meta.dirname, '../../../.reports/botmux-card-confirmation-test');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(`${root}/unit-`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const request: ConfirmationRequest = {
    ...createRequest({ summary: 'Test', testOnly: true, expiresAt: new Date(Date.now() + 60000).toISOString() }, randomUUID()),
    messageId: 'om_test', status: 'pending',
  };
  saveRequest(dir, request);
  const event: CardActionEvent = {
    schemaVersion: 1, actionName: 'card_confirmation_decide', larkAppId: TARGET.larkAppId,
    operator: { open_id: TARGET.operatorId }, context: { open_chat_id: TARGET.chatId, open_message_id: 'om_test' },
    action: { value: { requestId: request.id, nonce: request.nonce, action: ACTION_NAME, optionId: 'confirm' } },
  };
  return { dir, request, event };
}

test('confirmation is persisted once; opposite replay does not change it; terminal card removes buttons', t => {
  const { dir, request, event } = fixture(t);
  assert.equal(decide(dir, event).request.status, 'confirmed');
  event.action!.value!.optionId = 'reject';
  assert.equal(decide(dir, event).repeated, true);
  const stored = readRequest(dir, request.id);
  assert.equal(stored.decision?.value, 'confirm');
  assert.equal(stored.testOnly, true);
  assert.ok(!JSON.stringify(renderCard(stored)).includes('"tag":"button"'));
});
test('rejection stays rejected', t => {
  const { dir, event } = fixture(t);
  event.action!.value!.optionId = 'reject';
  assert.equal(decide(dir, event).request.status, 'rejected');
  event.action!.value!.optionId = 'confirm';
  assert.equal(decide(dir, event).request.status, 'rejected');
});
test('schema 2 buttons execute callbacks carrying this request and both distinct decisions', t => {
  const { request } = fixture(t);
  const card = renderCard(request) as unknown as RenderedCard;
  const columnSet = card.body.elements.find(e => e.tag === 'column_set')!;
  const buttons = columnSet.columns!.flatMap(c => c.elements);
  assert.deepEqual(buttons.map(b => b.behaviors[0]!.value.optionId), ['confirm', 'reject']);
  for (const button of buttons) {
    assert.equal(button.behaviors[0]!.type, 'callback');
    assert.equal(button.behaviors[0]!.value.requestId, request.id);
    assert.equal(button.behaviors[0]!.value.nonce, request.nonce);
  }
});
test('wrong application, sender, chat, message, nonce and unknown choice cannot approve', t => {
  const { dir, request, event } = fixture(t);
  for (const mutate of [
    (e: CardActionEvent) => { e.larkAppId = 'wrong'; },
    (e: CardActionEvent) => { e.operator!.open_id = 'wrong'; },
    (e: CardActionEvent) => { e.context!.open_chat_id = 'wrong'; },
    (e: CardActionEvent) => { e.context!.open_message_id = 'wrong'; },
    (e: CardActionEvent) => { e.action!.value!.nonce = 'wrong'; },
    (e: CardActionEvent) => { e.action!.value!.optionId = 'unknown'; },
  ]) {
    const e = structuredClone(event);
    mutate(e);
    assert.throws(() => decide(dir, e));
    assert.equal(readRequest(dir, request.id).status, 'pending');
  }
});
test('expired and invalidated requests cannot approve', t => {
  const { dir, request, event } = fixture(t);
  assert.equal(decide(dir, event, Date.parse(request.expiresAt)).request.status, 'expired');
  assert.equal(readRequest(dir, request.id).decision, undefined);
  request.status = 'invalidated';
  saveRequest(dir, request);
  assert.equal(decide(dir, event).request.status, 'invalidated');
});

test('business options use stored payload and reject callback-injected business data', t => {
  const { dir, request, event } = fixture(t);
  request.options = [{ id: 'course_1', label: '选择课程', type: 'default', result: 'selected', payload: { scheduleId: 'approved_schedule' }, resultText: null }];
  saveRequest(dir, request);
  event.action!.value!.optionId = 'course_1';
  event.action!.value!.payload = { scheduleId: 'forged_schedule' };
  const selected = decide(dir, event).request;
  assert.equal(selected.status, 'selected');
  assert.deepEqual(selected.decision?.payload, { scheduleId: 'approved_schedule' });
  assert.equal(selected.decision?.source, 'botmux-card-action');
  assert.ok(!JSON.stringify(renderCard(selected)).includes('"tag":"button"'));
});

test('requests for another verified target remain isolated', t => {
  const { dir, request, event } = fixture(t);
  request.operatorId = 'ou_another';
  saveRequest(dir, request);
  assert.throws(() => decide(dir, event), /identity/);
  event.operator!.open_id = 'ou_another';
  assert.equal(decide(dir, event).request.status, 'confirmed');
});

test('request validation rejects malformed expiry, duplicate options and unsupported results', () => {
  const input = { summary: 'Action', expiresAt: new Date(Date.now() + 60000).toISOString() };
  const sid = randomUUID();
  const invalid = (data: unknown) => data as ConfirmationInput;
  for (const data of [
    invalid({ ...input, expiresAt: 'invalid' }), invalid({ ...input, expiresAt: new Date(0).toISOString() }),
    invalid({ ...input, testOnly: 'false' }),
    invalid({ ...input, options: [{ id: 'a', label: 'A', result: 'confirmed' }, { id: 'a', label: 'B', result: 'rejected' }] }),
    invalid({ ...input, options: [{ id: 'a', label: 'A', result: 'execute' }] }),
  ]) assert.throws(() => createRequest(data, sid));
});

function formFixture(t: test.TestContext) {
  const result = fixture(t);
  result.request.selection = { placeholder: '选择课程', submitLabel: '预订' };
  result.request.options = [
    { id: 'course_1', label: '18:40 搏击 19元', result: 'confirmed', type: 'default', payload: { scheduleId: 'approved', onlineCost: 1900 }, resultText: null },
    { id: 'reject', label: '取消', result: 'rejected', type: 'danger', payload: null, resultText: null },
  ];
  saveRequest(result.dir, result.request);
  result.event.action = {
    value: { ...result.event.action!.value!, optionId: '__submit' },
    formValue: { choice: 'course_1', onlineCost: 1 },
  };
  return result;
}

test('Botmux normalized formValue submits a registered option and uses only its stored business payload', t => {
  const { dir, request, event } = formFixture(t);
  const card = renderCard(request) as { body: { elements: any[] } };
  const form = card.body.elements.find(element => element.tag === 'form');
  assert.equal(form.elements[0].tag, 'select_static');
  assert.equal(form.elements[0].name, 'choice');
  assert.equal(form.elements[0].required, true);
  assert.equal(form.elements[0].initial_option, undefined);
  assert.equal(form.elements[0].behaviors, undefined, 'selection alone does not send a callback');
  assert.deepEqual(form.elements[0].options.map((option: { value: string }) => option.value), ['course_1']);
  assert.equal(form.elements[1].form_action_type, 'submit');
  assert.deepEqual(form.elements[1].value, form.elements[1].behaviors[0].value);
  const result = decide(dir, event).request;
  assert.equal(result.status, 'confirmed');
  assert.equal(result.decision?.value, 'course_1');
  assert.deepEqual(result.decision?.payload, { scheduleId: 'approved', onlineCost: 1900 });
  assert.ok(!JSON.stringify(renderCard(result)).includes('select_static'));
  assert.equal(decide(dir, event).repeated, true);
});

test('missing, forged, rejected or non-string form choices cannot authorize booking', t => {
  const { dir, request, event } = formFixture(t);
  for (const formValue of [undefined, null, [], {}, { choice: ['course_1'] }, { choice: 'forged' }, { choice: 'reject' }]) {
    const invalid = structuredClone(event);
    invalid.action!.formValue = formValue;
    assert.throws(() => decide(dir, invalid));
    assert.equal(readRequest(dir, request.id).status, 'pending');
  }
  event.action!.value!.optionId = 'course_1';
  assert.throws(() => decide(dir, event), /form submission/);
});

test('raw Feishu form_value cannot substitute for the Botmux gateway contract', t => {
  const { dir, request, event } = formFixture(t);
  const raw = { ...event, action: { value: event.action!.value, form_value: event.action!.formValue } };
  assert.throws(() => decide(dir, raw), /Missing form selection/);
  assert.equal(readRequest(dir, request.id).status, 'pending');
  assert.equal(decide(dir, event).request.status, 'confirmed');
});

test('form cancellation works without a choice and cannot later be replaced by a booking', t => {
  const { dir, event } = formFixture(t);
  event.action = { value: { ...event.action!.value!, optionId: 'reject' } };
  assert.equal(decide(dir, event).request.status, 'rejected');
  event.action = { value: { ...event.action!.value!, optionId: '__submit' }, formValue: { choice: 'course_1' } };
  assert.equal(decide(dir, event).request.status, 'rejected');
});

test('form submission still checks the recipient, message, nonce and expiry', t => {
  const { dir, request, event } = formFixture(t);
  for (const mutate of [
    (e: CardActionEvent) => { e.operator!.open_id = 'wrong'; },
    (e: CardActionEvent) => { e.context!.open_message_id = 'wrong'; },
    (e: CardActionEvent) => { e.action!.value!.nonce = 'wrong'; },
  ]) {
    const invalid = structuredClone(event);
    mutate(invalid);
    assert.throws(() => decide(dir, invalid), /identity/);
  }
  assert.equal(decide(dir, event, Date.parse(request.expiresAt)).request.status, 'expired');
  assert.equal(readRequest(dir, request.id).decision, undefined);
});

test('form configuration rejects a reserved submit ID and an empty choice list', () => {
  const input = { summary: 'Booking', expiresAt: new Date(Date.now() + 60000).toISOString(), selection: { placeholder: 'Course', submitLabel: 'Book' } };
  assert.throws(() => createRequest({ ...input, options: [{ id: '__submit', label: 'Course', result: 'confirmed' }] }, randomUUID()));
  assert.throws(() => createRequest({ ...input, options: [{ id: 'reject', label: 'Cancel', result: 'rejected' }] }, randomUUID()));
  assert.throws(() => createRequest({ ...input, selection: { placeholder: '', submitLabel: 'Book' } }, randomUUID()));
});
