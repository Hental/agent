import type { CardV2 } from './test-card.js';

export interface CourseListItem {
  scheduleId: string;
  className: string;
  coachName: string;
  startTime: string;
  endTime: string;
  onlineCost: number;
}

export interface CourseListCardInput {
  requestId: string;
  date: string;
  gymName: string;
  courses: CourseListItem[];
}

function escapeMarkdown(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&#60;', '>': '&#62;', '*': '&#42;', '_': '&#95;',
    '~': '&#126;', '[': '&#91;', ']': '&#93;', '(': '&#40;', ')': '&#41;', '#': '&#35;',
  };
  return value.replace(/[&<>*_~\[\]()#]/g, (character) => entities[character] ?? character);
}

export function createCourseListCard(input: CourseListCardInput): CardV2 {
  const courseElements = input.courses.flatMap((course, index) => ([
    {
      tag: 'column_set', flex_mode: 'none', columns: [{
        tag: 'column', width: 'weighted', weight: 1, background_style: 'blue-50',
        padding: '12px', vertical_spacing: '6px', elements: [
          { tag: 'markdown', content: `**${index + 1}. <font color='blue'>${escapeMarkdown(course.className)}</font>**` },
          { tag: 'markdown', content: `**时间**  ${escapeMarkdown(course.startTime)} - ${escapeMarkdown(course.endTime)}\n**教练**  ${escapeMarkdown(course.coachName || '待定')}\n**个人支付**  ¥${(course.onlineCost / 100).toFixed(2)}` },
          {
            tag: 'button', element_id: `select-${index + 1}`,
            text: { tag: 'plain_text', content: `预订第 ${index + 1} 门` },
            type: 'primary_filled', width: 'fill',
            behaviors: [{ type: 'callback', value: {
              action: 'select_course', request_id: input.requestId, schedule_id: course.scheduleId,
            } }],
          },
        ],
      }],
    },
  ]));

  return {
    schema: '2.0',
    config: {
      update_multi: true,
      width_mode: 'default',
      enable_forward: false,
      summary: { content: `${input.date} 超级猩猩课程待选择` },
    },
    header: {
      title: { tag: 'plain_text', content: '选择要预订的课程' },
      subtitle: { tag: 'plain_text', content: `${input.date} · ${input.gymName} · 18:30–21:00` },
      template: 'blue',
      icon: { tag: 'standard_icon', token: 'calendar_colorful' },
      text_tag_list: [{ tag: 'text_tag', text: { tag: 'plain_text', content: '待选择' }, color: 'blue' }],
    },
    body: {
      direction: 'vertical',
      padding: '12px 12px 20px 12px',
      vertical_spacing: '12px',
      elements: [
        ...courseElements,
        { tag: 'markdown', content: '<font color=\'grey\'>选择课程后将立即创建一个支付宝待支付订单；取消不会下单。</font>', text_size: 'notation' },
        {
          tag: 'button', element_id: 'cancel-booking',
          text: { tag: 'plain_text', content: '取消预订' }, type: 'default', width: 'fill',
          behaviors: [{ type: 'callback', value: { action: 'cancel_order', request_id: input.requestId } }],
        },
      ],
    },
  };
}
