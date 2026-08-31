import { Hono } from 'hono';
import { createTestCard } from './cards/test-card.js';
import { createBookingCard, type BookingCardInput } from './cards/booking-card.js';
import { createCourseListCard, type CourseListCardInput, type CourseListItem } from './cards/course-list-card.js';
import { CardActionStore } from './card-action-store.js';
import { EventStore } from './event-store.js';
import { extractMessageId, type ReceiveIdType, type SendTextInput } from './lark.js';
import type { EnqueueResult } from './message-processor.js';

const receiveIdTypes = new Set<ReceiveIdType>(['chat_id', 'open_id', 'user_id', 'union_id', 'email']);

export interface AppDependencies {
  store: EventStore;
  cardActions: CardActionStore;
  enqueueEvent(eventId: string): EnqueueResult;
  sendText(input: SendTextInput): Promise<unknown>;
  sendCard(receiveId: string, receiveIdType: ReceiveIdType, card: object): Promise<unknown>;
  queueStats(): { active: number; pending: number };
}

async function jsonBody(context: { req: { json<T>(): Promise<T> } }): Promise<Record<string, unknown> | null> {
  try {
    return await context.req.json<Record<string, unknown>>();
  } catch {
    return null;
  }
}

export function createApp(dependencies: AppDependencies): Hono {
  const app = new Hono();

  app.get('/health', (context) => context.json({
    ok: true,
    service: 'lark-bot',
    uptimeSeconds: Math.floor(process.uptime()),
    events: dependencies.store.size,
    queue: dependencies.queueStats(),
  }));

  app.get('/events', (context) => {
    const rawLimit = context.req.query('limit') || '50';
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return context.json({ ok: false, error: 'limit 必须是 1 到 100 之间的整数' }, 400);
    }
    return context.json({ ok: true, events: dependencies.store.list(limit) });
  });

  app.get('/card-actions', (context) => {
    const requestId = context.req.query('requestId')?.trim() || '';
    if (!requestId) return context.json({ ok: false, error: '缺少 requestId' }, 400);
    return context.json({ ok: true, actions: dependencies.cardActions.list(requestId) });
  });

  app.post('/events/:eventId/process', (context) => {
    const result = dependencies.enqueueEvent(context.req.param('eventId'));
    if (result.kind === 'not_found') {
      return context.json({ ok: false, error: '事件不存在' }, 404);
    }
    if (result.kind === 'accepted') {
      return context.json({ ok: true, accepted: true, event: result.event }, 202);
    }
    return context.json({ ok: true, accepted: false, reason: result.kind, event: result.event });
  });

  app.post('/messages', async (context) => {
    const body = await jsonBody(context);
    if (!body) return context.json({ ok: false, error: '请求体必须是 JSON' }, 400);

    const receiveId = typeof body.receiveId === 'string' ? body.receiveId.trim() : '';
    const receiveIdType = typeof body.receiveIdType === 'string' ? body.receiveIdType : 'chat_id';
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!receiveId || !text || !receiveIdTypes.has(receiveIdType as ReceiveIdType)) {
      return context.json({
        ok: false,
        error: '需要 receiveId、text，receiveIdType 可为 chat_id/open_id/user_id/union_id/email',
      }, 400);
    }

    try {
      const response = await dependencies.sendText({
        receiveId,
        receiveIdType: receiveIdType as ReceiveIdType,
        text,
      });
      return context.json({ ok: true, messageId: extractMessageId(response) });
    } catch (error) {
      console.error('Hono API 发送消息失败：', error);
      return context.json({ ok: false, error: '发送消息失败，请查看服务日志' }, 502);
    }
  });

  app.post('/cards/test', async (context) => {
    const body = await jsonBody(context);
    if (!body) return context.json({ ok: false, error: '请求体必须是 JSON' }, 400);
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const receiveId = typeof body.receiveId === 'string' ? body.receiveId.trim() : email;
    const receiveIdType = typeof body.receiveIdType === 'string' ? body.receiveIdType : 'email';
    if (!receiveId || !receiveIdTypes.has(receiveIdType as ReceiveIdType)) {
      return context.json({
        ok: false,
        error: '需要 receiveId，receiveIdType 可为 chat_id/open_id/user_id/union_id/email',
      }, 400);
    }

    try {
      const response = await dependencies.sendCard(
        receiveId,
        receiveIdType as ReceiveIdType,
        createTestCard(),
      );
      return context.json({ ok: true, messageId: extractMessageId(response) });
    } catch (error) {
      console.error('Hono API 发送测试卡片失败：', error);
      return context.json({ ok: false, error: '发送卡片失败，请查看服务日志' }, 502);
    }
  });

  app.post('/cards/booking', async (context) => {
    const body = await jsonBody(context);
    if (!body) return context.json({ ok: false, error: '请求体必须是 JSON' }, 400);
    const receiveId = typeof body.receiveId === 'string' ? body.receiveId.trim() : '';
    const receiveIdType = typeof body.receiveIdType === 'string' ? body.receiveIdType : 'email';
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    const className = typeof body.className === 'string' ? body.className.trim() : '';
    const gymName = typeof body.gymName === 'string' ? body.gymName.trim() : '';
    const startTime = typeof body.startTime === 'string' ? body.startTime.trim() : '';
    const endTime = typeof body.endTime === 'string' ? body.endTime.trim() : '';
    const onlineCost = typeof body.onlineCost === 'number' ? body.onlineCost : Number.NaN;
    if (!receiveId || !receiveIdTypes.has(receiveIdType as ReceiveIdType)
      || !requestId || !className || !gymName || !startTime || !endTime
      || !Number.isInteger(onlineCost) || onlineCost < 0) {
      return context.json({ ok: false, error: '预约卡片参数无效' }, 400);
    }
    try {
      const input: BookingCardInput = { requestId, className, gymName, startTime, endTime, onlineCost };
      const response = await dependencies.sendCard(receiveId, receiveIdType as ReceiveIdType, createBookingCard(input));
      return context.json({ ok: true, messageId: extractMessageId(response), requestId });
    } catch (error) {
      console.error('Hono API 发送预约卡片失败：', error);
      return context.json({ ok: false, error: '发送预约卡片失败，请查看服务日志' }, 502);
    }
  });

  app.post('/cards/course-list', async (context) => {
    const body = await jsonBody(context);
    if (!body) return context.json({ ok: false, error: '请求体必须是 JSON' }, 400);
    const receiveId = typeof body.receiveId === 'string' ? body.receiveId.trim() : '';
    const receiveIdType = typeof body.receiveIdType === 'string' ? body.receiveIdType : 'email';
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const gymName = typeof body.gymName === 'string' ? body.gymName.trim() : '';
    const courses = Array.isArray(body.courses) ? body.courses : [];
    const validCourses = courses.every((item): item is CourseListItem => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const course = item as Record<string, unknown>;
      return typeof course.scheduleId === 'string' && course.scheduleId.trim().length > 0
        && typeof course.className === 'string' && course.className.trim().length > 0
        && typeof course.coachName === 'string'
        && typeof course.startTime === 'string' && course.startTime.trim().length > 0
        && typeof course.endTime === 'string' && course.endTime.trim().length > 0
        && Number.isInteger(course.onlineCost) && (course.onlineCost as number) >= 0;
    });
    if (!receiveId || !receiveIdTypes.has(receiveIdType as ReceiveIdType)
      || !requestId || !date || !gymName || courses.length < 1 || courses.length > 10 || !validCourses) {
      return context.json({ ok: false, error: '课程列表卡片参数无效' }, 400);
    }
    try {
      const input: CourseListCardInput = { requestId, date, gymName, courses };
      const response = await dependencies.sendCard(receiveId, receiveIdType as ReceiveIdType, createCourseListCard(input));
      return context.json({ ok: true, messageId: extractMessageId(response), requestId });
    } catch (error) {
      console.error('Hono API 发送课程列表卡片失败：', error);
      return context.json({ ok: false, error: '发送课程列表卡片失败，请查看服务日志' }, 502);
    }
  });

  app.notFound((context) => context.json({ ok: false, error: 'Not Found' }, 404));
  return app;
}
