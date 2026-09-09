// Verified Mini private-chat mapping. Callers must verify the current Botmux session.
export const DEFAULT_TARGET = Object.freeze({
  larkAppId: 'cli_aa149e4ed9389cb5',
  chatId: 'oc_558e971f498438280d88ec1372df95c2',
  operatorId: 'ou_0de0382daf0b601518c6eb63486207d3',
});
export const PLUGIN_ID = 'card-confirmation';
export const ACTION_NAME = 'card_confirmation_decide';
export const DEFAULT_OPTIONS = Object.freeze([
  { id: 'confirm', label: '确认', type: 'primary', result: 'confirmed' },
  { id: 'reject', label: '拒绝', type: 'danger', result: 'rejected' },
]);
