# 默认模式：保存 action，agent loop 读取

适用于当前 agent 持续等待卡片按钮结果的流程。省略 `actionHandling` 或指定 `{"mode":"local"}`；无需声明 agent 类型或 Codex 会话 ID，也不会自动唤起已结束的会话。

## 发送请求

先按 [主技能](../SKILL.md) 核验收件人及完整 Botmux 会话 ID，再按 [共享插件说明](../../../../apps/botmux-card-confirmation/AGENTS.md) 确认插件服务和回调路由可用。业务工作流提供完整操作信息、选项及参数快照。

将请求保存到项目根目录 `.reports/<任务名>/request.json`，例如：

```json
{
  "title": "操作确认",
  "summary": "展示本次待执行操作的完整信息、参数与费用。",
  "expiresAt": "<替换为未来的带时区 ISO 时间>",
  "actionHandling": {"mode": "local"},
  "options": [
    {"id": "confirm", "label": "确认", "result": "confirmed", "type": "primary"},
    {"id": "reject", "label": "拒绝", "result": "rejected", "type": "danger"}
  ]
}
```

在项目根目录运行，替换示例中的路径与 ID：

```text
node apps/botmux-card-confirmation/dist/confirm.js health
node apps/botmux-card-confirmation/dist/confirm.js send <请求JSON绝对路径> <已核验的完整Botmux会话ID>
```

检查发送结果中的 `success`、`messageId`、`sessionId`，保留返回的 `requestId`。发卡成功表示消息已发送，尚不表示用户做出了决定。

## 读取按钮结果

Botmux 将按钮 action 转发给 Hono；共享插件核验身份、消息、nonce、选项和有效期后，将首个有效决定写入 `.reports/botmux-card-confirmation/<requestId>/request.json`。调用方使用查询接口读取，不直接修改该记录：

```text
node apps/botmux-card-confirmation/dist/confirm.js status <requestId>
```

agent loop 可以每秒查询一次同一个请求，并按状态处理：

| 状态 | 处理 |
| --- | --- |
| `pending` | 等待下一次查询，保留回调服务运行，不重新发卡。 |
| `confirmed` / `selected` | 核验本次决定后，按原工作流继续。`selected` 只代表选中某个选项。 |
| `rejected` | 停止本次待执行操作。 |
| `expired` / `invalidated` | 停止等待；需要继续时重新核对参数并创建新请求。 |
| `sending` / `send_unknown` | 发送尚未核实，检查 Botmux history，不批准业务或盲目重发。 |

执行前必须核对 `testOnly: false`、`decision.source: botmux-card-action`、预期选项及当前业务参数，确认该步骤尚未执行。业务 payload 以已存储的选项为准。重复查询同一个终态结果不得重复执行业务。

`status` 会尝试更新终态卡片。若返回 `cardPatchError`，可用 `patch <requestId>` 重试显示更新；它不改变已记录的决定。

## 停止与恢复

用户取消、业务参数变化或调用方不再等待时，对尚未决定的请求执行 `invalidate <requestId>`。已记录的终态决定不可变，停止后续业务由所属工作流处理。

当前 agent 轮次结束后，回调仍可由运行中的服务保存，但不会自动开始新轮次。之后手动恢复流程时，读取原 `requestId` 并重新核验业务状态。需要自动恢复原会话时，在发卡时选择 [resume 模式](button-confirmation.md)，不要同时由本地 loop 消费其结果。
