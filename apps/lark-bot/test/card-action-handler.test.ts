import { describe, expect, it, rs } from '@rstest/core';
import { handleCardAction } from '../src/card-action-handler.js';
import { CardActionStore } from '../src/card-action-store.js';
import { createCardActionHandler } from '../src/card-action-handler.js';

describe('handleCardAction', () => {
  it('returns a success toast for health check callback', () => {
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(handleCardAction({
      action: { tag: 'button', value: { action: 'health_check' } },
      operator: { operator_id: { open_id: 'ou_test' } },
    })).toEqual({
      toast: { type: 'success', content: '服务运行正常，长连接回调成功。' },
    });
    log.mockRestore();
  });

  it('stores booking confirmation with request id', () => {
    const store = new CardActionStore();
    const handler = createCardActionHandler(store);
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    handler({
      event_id: 'evt_1',
      action: { tag: 'button', value: { action: 'confirm_order', request_id: 'req_1' } },
      operator: { operator_id: { open_id: 'ou_test' } },
    });
    expect(store.list('req_1')).toMatchObject([{ action: 'confirm_order', operatorId: 'ou_test' }]);
    log.mockRestore();
  });

  it('stores selected course id', () => {
    const store = new CardActionStore();
    const handler = createCardActionHandler(store);
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    handler({
      event_id: 'evt_2',
      action: { tag: 'button', value: { action: 'select_course', request_id: 'req_2', schedule_id: 'schedule_1' } },
      operator: { operator_id: { open_id: 'ou_test' } },
    });
    expect(store.list('req_2')).toMatchObject([{
      action: 'select_course', scheduleId: 'schedule_1', operatorId: 'ou_test',
    }]);
    log.mockRestore();
  });

  it('ignores a course selection without schedule id', () => {
    const store = new CardActionStore();
    const handler = createCardActionHandler(store);
    const log = rs.spyOn(console, 'log').mockImplementation(() => undefined);
    handler({
      event_id: 'evt_3',
      action: { tag: 'button', value: { action: 'select_course', request_id: 'req_3' } },
      operator: { operator_id: { open_id: 'ou_test' } },
    });
    expect(store.list('req_3')).toEqual([]);
    log.mockRestore();
  });
});
