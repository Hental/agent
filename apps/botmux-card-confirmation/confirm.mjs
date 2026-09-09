import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { client, health } from './client.mjs';

const [command, arg, sessionId] = process.argv.slice(2);
try {
  let result;
  if (command === 'send-test') {
    result = await client.sendConfirmation({ title: '卡片交互', summary: '验证信息展示、确认和拒绝按钮的回调。',
      testOnly: true, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() }, arg);
  } else if (command === 'send' || command === 'send-card') {
    const data = JSON.parse(readFileSync(resolve(arg), 'utf8'));
    result = command === 'send' ? await client.sendConfirmation(data, sessionId) : await client.sendCard(data, sessionId);
  } else if (['status', 'invalidate', 'patch'].includes(command)) result = await client[command](arg);
  else if (command === 'health') result = await health();
  else {
    console.log('Commands: send <request.json> <verified-session-id> | send-test <verified-session-id> | send-card <card.json> <verified-session-id> | status <request-id> | invalidate <request-id> | patch <request-id> | health');
    process.exit(command && !['help', '--help'].includes(command) ? 1 : 0);
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ success: false, error: error.message }));
  process.exitCode = 1;
}
