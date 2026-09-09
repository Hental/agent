import { timingSafeEqual } from 'node:crypto';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { decide } from '../state.js';
import { renderCard } from '../card.js';
import { PLUGIN_ID } from '../defaults.js';

const token = process.env.BOTMUX_PLUGIN_CARD_ACTION_TOKEN;
const stateDir = process.env.CARD_CONFIRMATION_STATE_DIR;
if (!token || !stateDir) throw new Error('Missing Botmux plugin service configuration');
const expectedAuth = Buffer.from(`Bearer ${token}`);
const app = new Hono();

app.get('/health', c => c.json({ ok: true, pid: process.pid, pluginId: PLUGIN_ID }));
app.notFound(c => c.json({ error: 'Not found' }, 404));
app.onError((_error, c) => {
  // Parser errors may contain request fragments; never log callback bodies or credentials.
  console.warn('Card callback was not accepted');
  return c.json({
    schemaVersion: 1, ack: {
      toast: { type: 'warning', content: '该次选择未被接受，请刷新卡片或重新发起确认' },
    },
  });
});

app.post('/card-action',
  async (c, next) => {
    const actualAuth = Buffer.from(c.req.header('authorization') ?? '');
    if (actualAuth.length !== expectedAuth.length || !timingSafeEqual(actualAuth, expectedAuth)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  },
  bodyLimit({ maxSize: 65536, onError: c => c.json({ error: 'Payload too large' }, 413) }),
  async c => {
    const { request, repeated } = decide(stateDir, await c.req.json<unknown>());
    console.log(JSON.stringify({ requestId: request.id, status: request.status, repeated }));
    return c.json({
      schemaVersion: 1, ack: {
        toast: {
          type: request.status === 'expired' ? 'warning' : 'success',
          content: request.status === 'expired' ? '确认已过期，请重新发起' : request.testOnly ? '测试选择已收到，未执行业务操作' : '选择已记录',
        },
        card: renderCard(request),
      },
    });
  },
);

export const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: Number(process.env.PORT) });
process.on('SIGTERM', () => server.close(() => process.exit(0)));
