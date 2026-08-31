import * as Lark from '@larksuiteoapi/node-sdk';
import type { AppConfig } from './config.js';

export type ReceiveIdType = 'chat_id' | 'open_id' | 'user_id' | 'union_id' | 'email';

export interface SendTextInput {
  receiveId: string;
  receiveIdType?: ReceiveIdType;
  text: string;
}

export interface LarkServices {
  client: Lark.Client;
  wsClient: Lark.WSClient;
  sendText(input: SendTextInput): Promise<unknown>;
  replyText(messageId: string, text: string): Promise<unknown>;
  sendCard(receiveId: string, receiveIdType: ReceiveIdType, card: object): Promise<unknown>;
}

export interface LarkServiceOptions {
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export function createLarkServices(config: AppConfig, options: LarkServiceOptions = {}): LarkServices {
  const baseConfig = {
    appId: config.appId,
    appSecret: config.appSecret,
    domain: Lark.Domain.Feishu,
  };
  const client = new Lark.Client(baseConfig);
  const wsClient = new Lark.WSClient({
    ...baseConfig,
    loggerLevel: Lark.LoggerLevel.info,
    onReady: options.onReady,
    onError: options.onError,
  });

  return {
    client,
    wsClient,
    sendText({ receiveId, receiveIdType = 'chat_id', text }) {
      return client.im.v1.message.create({
        params: { receive_id_type: receiveIdType },
        data: {
          receive_id: receiveId,
          msg_type: 'text',
          content: JSON.stringify({ text }),
        },
      });
    },
    replyText(messageId, text) {
      return client.im.v1.message.reply({
        path: { message_id: messageId },
        data: {
          msg_type: 'text',
          content: JSON.stringify({ text }),
        },
      });
    },
    sendCard(receiveId, receiveIdType, card) {
      return client.im.v1.message.create({
        params: { receive_id_type: receiveIdType },
        data: {
          receive_id: receiveId,
          msg_type: 'interactive',
          content: JSON.stringify(card),
        },
      });
    },
  };
}

export function extractMessageId(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const messageId = (data as { message_id?: unknown }).message_id;
  return typeof messageId === 'string' ? messageId : null;
}
