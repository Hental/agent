import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { decide } from '../state.mjs';
import { renderCard } from '../card.mjs';
import { PLUGIN_ID } from '../defaults.mjs';

const token = process.env.BOTMUX_PLUGIN_CARD_ACTION_TOKEN;
const stateDir = process.env.CARD_CONFIRMATION_STATE_DIR;
if (!token || !stateDir) throw new Error('Missing Botmux plugin service configuration');
const expectedAuth = Buffer.from(`Bearer ${token}`);
export const server = createServer(async (req, res) => {
  const respond = (code, body) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (req.method === 'GET' && req.url === '/health') return respond(200, { ok: true, pid: process.pid, pluginId: PLUGIN_ID });
  if (req.method !== 'POST' || req.url !== '/card-action') return respond(404, { error: 'Not found' });
  const actualAuth = Buffer.from(req.headers.authorization ?? '');
  if (actualAuth.length !== expectedAuth.length || !timingSafeEqual(actualAuth, expectedAuth)) {
    return respond(401, { error: 'Unauthorized' });
  }
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 65536) return respond(413, { error: 'Payload too large' });
    }
    const body = Buffer.concat(chunks).toString('utf8');
    const { request, repeated } = decide(stateDir, JSON.parse(body));
    console.log(JSON.stringify({ requestId: request.id, status: request.status, repeated }));
    return respond(200, { schemaVersion: 1, ack: {
      toast: { type: request.status === 'expired' ? 'warning' : 'success',
        content: request.status === 'expired' ? '确认已过期，请重新发起' : request.testOnly ? '测试选择已收到，未执行业务操作' : '选择已记录' },
      card: renderCard(request),
    } });
  } catch (error) {
    // Do not log callback bodies, auth headers or tokens.
    console.warn(error.message);
    return respond(200, { schemaVersion: 1, ack: {
      toast: { type: 'warning', content: '该次选择未被接受，请刷新卡片或重新发起确认' },
    } });
  }
});
server.listen(Number(process.env.PORT), '127.0.0.1');
process.on('SIGTERM', () => server.close(() => process.exit(0)));
