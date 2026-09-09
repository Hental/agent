import { ACTION_NAME } from './defaults.js';
import type { ConfirmationRequest, RequestLifecycle } from './types.js';

const STATE_LABELS: Record<RequestLifecycle, string> = {
  pending: '等待选择', confirmed: '已确认', rejected: '已拒绝', selected: '已选择',
  expired: '已过期', invalidated: '已失效', sending: '准备发送', send_unknown: '发送结果待核验',
};

export function renderCard(request: ConfirmationRequest): Record<string, unknown> {
  const elements: Record<string, unknown>[] = [
    { tag: 'markdown', content: request.summary },
    {
      tag: 'markdown',
      content: `**状态：${STATE_LABELS[request.status] ?? request.status}**\n确认编号：${request.id}\n有效期：${new Date(request.expiresAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）`,
    },
  ];
  if (request.testOnly) elements.unshift({ tag: 'markdown', content: '**仅测试卡片及按钮回调。点击不会执行实际业务操作。**' });
  if (request.status === 'pending') {
    for (let i = 0; i < request.options.length; i += 2) {
      elements.push({
        tag: 'column_set', flex_mode: 'none',
        columns: request.options.slice(i, i + 2).map(option => {
          const value = { action: ACTION_NAME, requestId: request.id, nonce: request.nonce, optionId: option.id };
          return {
            tag: 'column', width: 'weighted', weight: 1,
            elements: [{
              tag: 'button', text: { tag: 'plain_text', content: option.label }, type: option.type,
              // Botmux 3.18.14 validates value; Feishu v2 executes behaviors. Keep identical.
              value, behaviors: [{ type: 'callback', value }],
            }],
          };
        }),
      });
    }
  } else if (request.decision) {
    elements.push({
      tag: 'markdown',
      content: request.testOnly
        ? `测试选择已收到：${request.decision.label}。未执行实际业务操作。`
        : request.decision.resultText ?? `已记录选择：${request.decision.label}。`,
    });
  }
  return {
    schema: '2.0', config: { wide_screen_mode: true, update_multi: true },
    header: {
      title: { tag: 'plain_text', content: `${request.title}${request.testOnly ? ' · 测试' : ''}` },
      template: request.status === 'confirmed' ? 'green' : request.status === 'rejected' ? 'grey' : 'blue',
    },
    body: { elements },
  };
}
