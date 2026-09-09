import { client, DEFAULT_TARGET, type ConfirmationInput, type Target } from '../../../../apps/botmux-card-confirmation/dist/client.js';

const DEFAULT_EMAIL = 'liutao.fe@bytedance.com';
function destination(email: string): { sessionId: string; target: Target } {
  const sessionId = process.env.BOTMUX_SESSION_ID;
  if (!sessionId) throw new Error('请按 lark-card 技能核验私聊，并设置完整的 BOTMUX_SESSION_ID');
  const mapping = process.env.BOTMUX_CARD_TARGET_JSON ? JSON.parse(process.env.BOTMUX_CARD_TARGET_JSON) : null;
  if (mapping) {
    if (mapping.email !== email) throw new Error('BOTMUX_CARD_TARGET_JSON 与收件人邮箱不符');
    for (const [key, prefix] of [['larkAppId', 'cli_'], ['chatId', 'oc_'], ['operatorId', 'ou_']]) {
      if (typeof mapping[key] !== 'string' || !mapping[key].startsWith(prefix)) throw new Error(`缺少已核验的 ${key}`);
    }
    return { sessionId, target: mapping as Target };
  }
  if (email !== DEFAULT_EMAIL) throw new Error('其他收件人需要提供已核验的 BOTMUX_CARD_TARGET_JSON（email、larkAppId、chatId、operatorId）');
  return { sessionId, target: DEFAULT_TARGET };
}
export async function sendConfirmation(data: ConfirmationInput, email = DEFAULT_EMAIL) {
  const { sessionId, target } = destination(email);
  return client.sendConfirmation({ ...data, target }, sessionId);
}
export async function sendMessage(summary: string, email = DEFAULT_EMAIL, title = '超级猩猩预约') {
  const { sessionId, target } = destination(email);
  return client.sendCard({ schema: '2.0', header: { title: { tag: 'plain_text', content: title } },
    body: { elements: [{ tag: 'markdown', content: summary }] } }, sessionId, target);
}
export async function waitForChoice(requestId: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await client.status(requestId);
    if (result.testOnly) throw new Error('测试卡片不能授权真实订单');
    if (['confirmed', 'rejected', 'selected'].includes(result.status)) {
      if (result.decision?.source !== 'botmux-card-action') throw new Error('缺少有效的 Botmux 回调');
      return result;
    }
    if (result.status !== 'pending') throw new Error(`卡片确认已结束：${result.status}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  await client.invalidate(requestId);
  throw new Error('等待飞书卡片选择超时');
}
