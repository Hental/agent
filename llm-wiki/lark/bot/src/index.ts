import { serve } from '@hono/node-server';
import * as Lark from '@larksuiteoapi/node-sdk';
import { createApp } from './app.js';
import { createCardActionHandler } from './card-action-handler.js';
import { CardActionStore } from './card-action-store.js';
import { loadConfig } from './config.js';
import { EventStore } from './event-store.js';
import { createLarkServices } from './lark.js';
import { createMessageHandler } from './message-handler.js';
import { MessageProcessor } from './message-processor.js';
import { createLarkFailureHandler } from './server-lifecycle.js';
import { TaskQueue } from './task-queue.js';

const config = loadConfig();
let server: ReturnType<typeof serve> | undefined;
const handleLarkFailure = createLarkFailureHandler(() => server);
const lark = createLarkServices(config, { onError: handleLarkFailure });
const store = new EventStore(config.eventStoreCapacity);
const cardActions = new CardActionStore(config.eventStoreCapacity);
const queue = new TaskQueue(config.processConcurrency);
const processor = new MessageProcessor({
  store,
  queue,
  replyText: lark.replyText,
  config,
});
const handleMessage = createMessageHandler({ store, processor, autoReply: config.autoReply });
const eventDispatcher = new Lark.EventDispatcher({}).register({
  'im.message.receive_v1': handleMessage,
  'card.action.trigger': createCardActionHandler(cardActions),
});
const app = createApp({
  store,
  cardActions,
  enqueueEvent: (eventId) => processor.enqueue(eventId),
  sendText: lark.sendText,
  sendCard: lark.sendCard,
  queueStats: () => ({ active: queue.active, pending: queue.size }),
});
server = serve({ fetch: app.fetch, hostname: config.host, port: config.port }, (info) => {
  console.log(`Hono 本地服务已启动：http://${info.address}:${info.port}`);
});

console.log(`正在启动飞书 Bot 长连接（domain=${config.domainName}, autoReply=${config.autoReply}）...`);
void lark.wsClient.start({ eventDispatcher }).catch((error: unknown) => {
  handleLarkFailure(error);
});

function shutdown(signal: string): void {
  console.log(`收到 ${signal}，正在停止 Hono 服务...`);
  server?.close(() => {
    process.exitCode = 0;
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
