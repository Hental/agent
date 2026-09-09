import { readFileSync } from 'node:fs';
const runtime = JSON.parse(readFileSync(new URL('../runtime.json', import.meta.url), 'utf8'));
const port = 19361;
export default {
  mode: 'manual', port,
  pm2: {
    script: './service/server.js', interpreter: runtime.node, autorestart: true,
    env: { CARD_CONFIRMATION_STATE_DIR: runtime.stateDir },
  },
  urls() { return { healthUrl: `http://127.0.0.1:${port}/health` }; },
};
