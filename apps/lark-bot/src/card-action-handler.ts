import { CardActionStore, type BookingDecision } from './card-action-store.js';

interface CardActionData {
  event_id?: string;
  action?: {
    tag?: string;
    value?: { action?: string; request_id?: string; schedule_id?: string };
  };
  operator?: { operator_id?: { open_id?: string } };
}

export function createCardActionHandler(store: CardActionStore) {
  return function handleCardAction(data: CardActionData): { toast: { type: string; content: string } } {
  const action = data.action?.value?.action;
  const requestId = data.action?.value?.request_id;
  const scheduleId = data.action?.value?.schedule_id;
  const operatorId = data.operator?.operator_id?.open_id ?? '';
  console.log(JSON.stringify({
    event: 'card.action.trigger',
    action,
    actionTag: data.action?.tag,
    operatorId,
    requestId,
    scheduleId,
  }));

  const isStorableAction = action === 'confirm_order' || action === 'cancel_order'
    || (action === 'select_course' && Boolean(scheduleId));
  if (isStorableAction && requestId) {
    store.add({
      id: data.event_id || `${requestId}:${action}:${operatorId}`,
      requestId,
      action: action as BookingDecision,
      ...(scheduleId ? { scheduleId } : {}),
      operatorId,
    });
  }

  if (action === 'health_check') {
    return { toast: { type: 'success', content: '服务运行正常，长连接回调成功。' } };
  }
  if (action === 'confirm') {
    return { toast: { type: 'success', content: '已确认。' } };
  }
  if (action === 'cancel') {
    return { toast: { type: 'info', content: '已取消。' } };
  }
  if (action === 'confirm_order') return { toast: { type: 'success', content: '已确认，正在创建待支付订单。' } };
  if (action === 'select_course') return { toast: { type: 'success', content: '已选择课程，正在创建待支付订单。' } };
  if (action === 'cancel_order') return { toast: { type: 'info', content: '已取消，不会创建订单。' } };
  return { toast: { type: 'info', content: '操作已收到。' } };
  };
}

export const handleCardAction = createCardActionHandler(new CardActionStore());
