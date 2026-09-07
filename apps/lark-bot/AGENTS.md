# Lark Bot project instructions

## Directory ownership

- `src/` contains the Hono service, Feishu SDK integration, event state, and message processing.
- `cli/` contains an HTTP-only local client. It must never import or initialize `@larksuiteoapi/node-sdk`.
- `test/` contains isolated Rstest unit tests. Tests must not access the network or send real Feishu messages.

## Secrets and configuration

- Load `LARK_BOT_ID` and `LARK_BOT_SK` only from `lark/bot/.env` at runtime.
- Never print, copy, commit, or fixture real credentials.
- Keep fixed behavior (`autoReply`, `replyPrefix`, Feishu domain, log level) in `src/config.ts`, not `.env`.
- Unit tests and type checking must use injected fake configuration and never require `.env` credentials.

## Event handling

- A Feishu long-connection callback must return within 3 seconds. Store the event and enqueue slow work; do not await message sending in the callback.
- Preserve the `pending → processing → processed/failed` state machine.
- Keep processing idempotent: never reply twice to a processed event; allow explicit retries of failed events.

## Verification

Run all of these before handing off changes:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level=moderate
```

Mocks must be injected at module boundaries. Never start `WSClient`, call live OpenAPI, or send a real message from tests.
