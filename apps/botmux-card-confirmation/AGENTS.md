# Botmux card confirmation

`botmux-card-confirmation` is the shared card and button-interaction adapter for project workflows. Its Botmux package is `botmux-plugin-card-confirmation`, plugin ID is `card-confirmation`, and callback action is `card_confirmation_decide`.

Botmux is the gateway for all outgoing Feishu/Lark cards, card updates and incoming button events. This app owns request validation and decision state. Business workflows own card content, allowed choices and subsequent business actions. The callback never executes shell commands, calls ADB, submits an order or makes a payment. Use `lark-bot` to verify the current recipient and full Botmux session ID before sending.

## Structure and commands

- `client.mjs` / `client.d.mts`: shared JavaScript/TypeScript API; all sending and patching uses Botmux CLI argument arrays. No Feishu SDK, application secret or direct OpenAPI call is used here.
- `confirm.mjs`: CLI wrapper for the same API. Every successful command prints one JSON result.
- `src/request.mjs`: validates generic title, summary, expiry, target, options and business context.
- `src/state.mjs`: authenticates the callback's request bindings and persists the first valid decision.
- `src/card.mjs`: renders schema 2.0 cards, including multi-option selection and terminal cards without buttons.
- `src/service/`: loopback HTTP callback service, authenticated with Botmux's gateway token.
- Runtime state and generated card artifacts live under project-root `.reports/botmux-card-confirmation/`. Tests use `.reports/botmux-card-confirmation-test/`.

Run from this directory:

```bash
node build.mjs
node --test test/*.test.mjs
node confirm.mjs health
node confirm.mjs send /absolute/request.json <verified-full-session-id>
node confirm.mjs send-card /absolute/display-card.json <verified-full-session-id>
node confirm.mjs status <request-id>
node confirm.mjs invalidate <request-id>
node confirm.mjs patch <request-id>
```

`send-card` accepts display/link cards. Callback cards use `send`, which registers every option and binds it to the request. For existing raw card integrations, Botmux's `send --card-file` / `card patch` remain the transport; additional interactive components must have a declared and implemented Botmux handler before use.

## Confirmation request

Required fields are `summary` (Markdown) and `expiresAt` (future ISO time with timezone). Optional fields:

- `title`: defaults to `操作确认`; the caller supplies its business title.
- `options`: 1–20 distinct choices. Each has `id`, `label`, `result` (`confirmed`, `rejected`, or `selected`), and optional `type` (`default`, `primary`, `danger`), `payload`, `resultText`. Defaults are confirm/reject. `resultText` describes the recorded choice, not an operation that has not happened yet.
- `context`: local business metadata/snapshot version to associate with this request; not included in callback button values.
- `snapshotPath`: optional snapshot association; send the actual image through Botmux separately in the same verified chat and reference the request ID.
- `target`: verified `larkAppId`, `chatId`, `operatorId`. If omitted, use the verified Mini private-chat mapping in `src/defaults.mjs`. The client also checks the supplied session's current chat via Botmux history. Verify the app/operator mapping before using a different target.
- `testOnly`: defaults to false. True requests are visibly labelled tests and must never authorize business execution.

Example options for a booking workflow:

```json
[
  {"id":"course_1","label":"选择课程 A","result":"selected","payload":{"scheduleId":"schedule_A"}},
  {"id":"reject","label":"取消预订","result":"rejected","type":"danger"}
]
```

A button carries only `action`, `requestId`, `nonce`, and `optionId`. The callback resolves its result and payload from the stored allowlist; callback-supplied business payload is ignored. The service checks its gateway token plus application, operator, chat, message, nonce, expiry and pending state. It only accepts the first valid choice. `decision` records the choice ID, label, stored payload, actor, event ID, message ID and `source: botmux-card-action`.

Business callers read `status`, reject `testOnly`, require the expected decision and source, and recheck current business parameters before acting. `selected` is a selection, not blanket approval. Changes invalidate the pending request and require a new card. Terminal decisions remain immutable, including after `invalidate` or repeated callbacks. Unknown send results stay `send_unknown`; inspect Botmux history before retrying. `status` reconciles terminal cards through Botmux once; `cardPatchError` signals a failed display update that `patch` can retry without resending.

## Install and run

```bash
botmux plugin install /Users/liutao/workspace/agent/apps/botmux-card-confirmation --link
botmux plugin enable card-confirmation
botmux plugin service start card-confirmation
```

Machine-default enablement makes this the shared card adapter. Per-bot enablement is also supported with `--bot <verified-app-id>`. The service is manual and listens only on `127.0.0.1:19361`. Keep it alive while any interactive card awaits a choice. Display/link cards only require Botmux. Rebuild and restart this service after runtime edits; do not restart unrelated bots.

The bundled Botmux 3.18.14 binary can fail to start plugin services with `pm2_jlist_json_not_found`. After normal `plugin service start` generates the descriptor, use `node run-local.mjs`. This foreground compatibility runner uses Botmux's generated gateway token, verifies the exact child PID through health, and only then publishes routing metadata. Stop it with SIGTERM after all pending workflows end; it removes its own metadata. Never manufacture a token or fake an online record.

Botmux 3.18.14 may retain per-bot plugin configuration from daemon startup, so enabling a plugin for one bot may allow sending before callbacks are routed. Machine-default plugin settings are loaded dynamically. Ensure the enabled scope reaches the intended bot; service health alone does not prove gateway routing. This project's shared adapter uses machine-default enablement. Do not restart a busy bot just to refresh its plugin setting.

Schema 2.0 buttons execute `behaviors: [{type: "callback", value: ...}]`. Botmux 3.18.14 also validates the same top-level button `value`; keep both identical. In that version, `card patch` cannot retain callback buttons even with `--plugin-card-action`; patch terminal cards only. For changed pending content, invalidate and send a new request.

## Testing and migration

`node confirm.mjs send-test <verified-session-id>` sends a clearly labelled test only when the user requests a live test. Native UI automation may click test-only buttons during an authorized end-to-end test; record that the assistant performed the click. A real event from an automated test is not human business approval. Ordinary unit tests inject a Botmux runner and use isolated local fixtures; they do not send messages or create orders.

For a dedicated compatibility-runner test, `node finish-test.mjs <request-id>` waits at most 15 minutes, reconciles the terminal card, writes `test-result.json`, and stops the same service only if no other unresolved request needs it. Do not use this helper for a production request or treat its local test records as business approval.

This app replaces `apps/botmux-ride-confirmation` and the `ride-confirmation` plugin/action. Old test evidence remains under `.reports/amap-card-confirmation/`; it is not migrated into current requests or reused as approval. Disable and uninstall the old plugin once no live requests depend on it. The 2026-09-08 Feishu end-to-end results belong to the old version; validate the renamed implementation separately and identify local simulations as such.
