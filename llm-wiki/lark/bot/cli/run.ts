import { BotHttpClient } from './client.js';
import type { CliCommand } from './args.js';

export async function runCommand(command: CliCommand): Promise<unknown> {
  const client = new BotHttpClient(command.baseUrl);
  switch (command.name) {
    case 'health':
      return client.health();
    case 'events':
      return client.events(command.limit);
    case 'card-actions':
      return client.cardActions(command.requestId);
    case 'process':
      return client.process(command.eventId);
    case 'send':
      return client.send(command);
    case 'send-card':
      return client.sendCard(command.receiveId, command.receiveIdType);
    case 'send-booking-card':
      return client.sendBookingCard(command);
    case 'send-course-list-card':
      return client.sendCourseListCard(command);
  }
}
