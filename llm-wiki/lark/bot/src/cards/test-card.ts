export interface CardV2 {
  schema: '2.0';
  config: Record<string, unknown>;
  header: Record<string, unknown>;
  body: { direction: 'vertical'; padding: string; vertical_spacing: string; elements: unknown[] };
}

export function createTestCard(): CardV2 {
  return {
    schema: '2.0',
    config: {
      update_multi: true,
      width_mode: 'default',
      summary: { content: '飞书 Bot 功能测试' },
      style: {
        color: {
          'cus-muted': {
            light_mode: 'rgba(100,106,115,1)',
            dark_mode: 'rgba(150,155,163,1)',
          },
        },
      },
    },
    header: {
      title: { tag: 'plain_text', content: '飞书 Bot 功能测试' },
      subtitle: { tag: 'plain_text', content: 'Hono · TypeScript · 长连接' },
      template: 'blue',
      icon: { tag: 'standard_icon', token: 'ai-common_colorful' },
      text_tag_list: [
        { tag: 'text_tag', text: { tag: 'plain_text', content: '测试' }, color: 'blue' },
      ],
    },
    body: {
      direction: 'vertical',
      padding: '12px 12px 20px 12px',
      vertical_spacing: '12px',
      elements: [
        {
          tag: 'column_set',
          flex_mode: 'none',
          columns: [
            {
              tag: 'column',
              width: 'weighted',
              weight: 1,
              background_style: 'blue-50',
              padding: '12px',
              vertical_spacing: '4px',
              elements: [
                { tag: 'markdown', content: '**<font color=\'blue\'>连接状态</font>**' },
                {
                  tag: 'markdown',
                  content: '飞书长连接、Hono 服务与本地 CLI 已完成集成。',
                },
                {
                  tag: 'markdown',
                  content: '<font color=\'grey\'>请选择确认或取消。</font>',
                  text_size: 'notation',
                },
              ],
            },
          ],
        },
        {
          tag: 'column_set',
          flex_mode: 'bisect',
          horizontal_spacing: '8px',
          columns: [
            {
              tag: 'column',
              elements: [
                {
                  tag: 'button',
                  element_id: 'confirm',
                  text: { tag: 'plain_text', content: '确认' },
                  type: 'primary_filled',
                  width: 'fill',
                  behaviors: [{ type: 'callback', value: { action: 'confirm' } }],
                },
              ],
            },
            {
              tag: 'column',
              elements: [
                {
                  tag: 'button',
                  element_id: 'cancel',
                  text: { tag: 'plain_text', content: '取消' },
                  type: 'default',
                  width: 'fill',
                  behaviors: [{ type: 'callback', value: { action: 'cancel' } }],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
