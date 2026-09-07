import { describe, expect, it } from '@rstest/core';
import { createTestCard } from '../src/cards/test-card.js';
import { createBookingCard } from '../src/cards/booking-card.js';
import { createCourseListCard } from '../src/cards/course-list-card.js';

function collectByTag(value: unknown, tag: string, result: Array<Record<string, unknown>> = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectByTag(item, tag, result);
  } else if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (object.tag === tag) result.push(object);
    for (const child of Object.values(object)) collectByTag(child, tag, result);
  }
  return result;
}

describe('createTestCard', () => {
  it('builds a Card 2.0 payload with exactly two buttons', () => {
    const card = createTestCard();
    const buttons = collectByTag(card, 'button');
    expect(card.schema).toBe('2.0');
    expect(card.config.width_mode).toBe('default');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.type).toBe('primary_filled');
    expect(buttons[1]?.type).toBe('default');
  });

  it('has confirm and cancel callback actions', () => {
    const buttons = collectByTag(createTestCard(), 'button');
    const behaviors = buttons.flatMap((button) => button.behaviors as Array<Record<string, unknown>>);
    expect(buttons.map((button) => button.text)).toEqual([
      { tag: 'plain_text', content: '确认' },
      { tag: 'plain_text', content: '取消' },
    ]);
    expect(behaviors).toEqual([
      { type: 'callback', value: { action: 'confirm' } },
      { type: 'callback', value: { action: 'cancel' } },
    ]);
  });
});

describe('createBookingCard', () => {
  it('includes booking details and request-scoped callbacks', () => {
    const card = createBookingCard({
      requestId: 'req_1', className: '燃脂训练', gymName: '超级猩猩',
      startTime: '18:40', endTime: '19:40', onlineCost: 2900,
    });
    const buttons = collectByTag(card, 'button');
    expect(buttons).toHaveLength(2);
    expect(buttons.flatMap((button) => button.behaviors as Array<Record<string, unknown>>)).toEqual([
      { type: 'callback', value: { action: 'confirm_order', request_id: 'req_1' } },
      { type: 'callback', value: { action: 'cancel_order', request_id: 'req_1' } },
    ]);
    expect(JSON.stringify(card)).toContain('¥29.00');
  });
});

describe('createCourseListCard', () => {
  it('creates one selection button per course and one cancel button', () => {
    const card = createCourseListCard({
      requestId: 'req_list', date: '2026-08-15', gymName: '天府三街全能店',
      courses: [
        { scheduleId: 's1', className: '课程一', coachName: '教练甲', startTime: '18:40', endTime: '19:40', onlineCost: 1900 },
        { scheduleId: 's2', className: '课程二', coachName: '教练乙', startTime: '19:50', endTime: '20:50', onlineCost: 2900 },
      ],
    });
    const buttons = collectByTag(card, 'button');
    expect(buttons).toHaveLength(3);
    expect(buttons.flatMap((button) => button.behaviors as Array<Record<string, unknown>>)).toEqual([
      { type: 'callback', value: { action: 'select_course', request_id: 'req_list', schedule_id: 's1' } },
      { type: 'callback', value: { action: 'select_course', request_id: 'req_list', schedule_id: 's2' } },
      { type: 'callback', value: { action: 'cancel_order', request_id: 'req_list' } },
    ]);
  });
});
