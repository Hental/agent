import { EventStore } from './event-store.js';
import { MessageProcessor } from './message-processor.js';

export interface MessageEventData {
  event_id?: string;
  sender?: { sender_id?: { open_id?: string; user_id?: string } };
  message?: {
    message_id?: string;
    chat_id?: string;
    chat_type?: string;
    message_type?: string;
    content?: string;
  };
}

export function parseTextContent(content: string | undefined): string {
  if (!content) return '';
  try {
    const parsed = JSON.parse(content) as { text?: unknown };
    return typeof parsed.text === 'string' ? parsed.text.trim() : '';
  } catch {
    return '';
  }
}

export function createMessageHandler(options: {
  store: EventStore;
  processor: Pick<MessageProcessor, 'enqueue'>;
  autoReply: boolean;
}): (data: MessageEventData) => void {
  return (data) => {
    const message = data.message;
    if (!message?.message_id) return;

    const messageType = message.message_type || 'unknown';
    const text = messageType === 'text' ? parseTextContent(message.content) : '';
    const id = data.event_id || message.message_id;
    const added = options.store.add({
      id,
      messageId: message.message_id,
      chatId: message.chat_id || '',
      senderId: data.sender?.sender_id?.open_id || data.sender?.sender_id?.user_id || 'unknown',
      messageType,
      text,
    });

    console.log(JSON.stringify({
      event: 'message.received',
      eventId: id,
      messageId: message.message_id,
      created: added.created,
    }));

    if (added.created && options.autoReply && messageType === 'text' && text) {
      options.processor.enqueue(id);
    }
  };
}
