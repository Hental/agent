import type { CardV2 } from './test-card.js';

export interface BookingCardInput {
  requestId: string;
  className: string;
  gymName: string;
  startTime: string;
  endTime: string;
  onlineCost: number;
}

function escapeMarkdown(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&#60;', '>': '&#62;', '*': '&#42;', '_': '&#95;',
    '~': '&#126;', '[': '&#91;', ']': '&#93;', '(': '&#40;', ')': '&#41;', '#': '&#35;',
  };
  return value.replace(/[&<>*_~\[\]()#]/g, (character) => entities[character] ?? character);
}

export function createBookingCard(input: BookingCardInput): CardV2 {
  const className = escapeMarkdown(input.className);
  const gymName = escapeMarkdown(input.gymName);
  const startTime = escapeMarkdown(input.startTime);
  const endTime = escapeMarkdown(input.endTime);
  return {
    schema: '2.0',
    config: {
      update_multi: true,
      width_mode: 'default',
      enable_forward: false,
      summary: { content: '超级猩猩预约待确认' },
    },
    header: {
      title: { tag: 'plain_text', content: '超级猩猩预约确认' },
      subtitle: { tag: 'plain_text', content: `${input.startTime} · ${input.gymName}` },
      template: 'blue',
      icon: { tag: 'standard_icon', token: 'vote_colorful' },
      text_tag_list: [
        { tag: 'text_tag', text: { tag: 'plain_text', content: '待确认' }, color: 'blue' },
      ],
    },
    body: {
      direction: 'vertical',
      padding: '12px 12px 20px 12px',
      vertical_spacing: '12px',
      elements: [
        {
          tag: 'column_set', flex_mode: 'none', columns: [{
            tag: 'column', width: 'weighted', weight: 1, background_style: 'blue-50',
            padding: '12px', vertical_spacing: '4px', elements: [
              { tag: 'markdown', content: `**<font color='blue'>${className}</font>**` },
              { tag: 'markdown', content: `**门店**  ${gymName}\n**时间**  ${startTime} - ${endTime}\n**个人支付**  ¥${(input.onlineCost / 100).toFixed(2)}` },
            ],
          }],
        },
        { tag: 'markdown', content: '<font color=\'grey\'>点击“是”将立即创建支付宝待支付订单；点击“否”不会下单。</font>', text_size: 'notation' },
        {
          tag: 'column_set', flex_mode: 'bisect', horizontal_spacing: '8px', columns: [
            { tag: 'column', elements: [{
              tag: 'button', element_id: 'confirm', text: { tag: 'plain_text', content: '是' },
              type: 'primary_filled', width: 'fill', behaviors: [{ type: 'callback', value: { action: 'confirm_order', request_id: input.requestId } }],
            }] },
            { tag: 'column', elements: [{
              tag: 'button', element_id: 'cancel', text: { tag: 'plain_text', content: '否' },
              type: 'default', width: 'fill', behaviors: [{ type: 'callback', value: { action: 'cancel_order', request_id: input.requestId } }],
            }] },
          ],
        },
      ],
    },
  };
}
