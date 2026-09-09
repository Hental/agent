import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Bundled at dist/service/index.js, so ../runtime.json resolves to dist/runtime.json.
const runtime = JSON.parse(readFileSync(resolve(import.meta.dirname, '../runtime.json'), 'utf8')) as {
  stateDir: string;
  node: string;
};
const port = 19361;
export default {
  mode: 'manual', port,
  pm2: {
    script: './service/server.js', interpreter: runtime.node, autorestart: true,
    env: { CARD_CONFIRMATION_STATE_DIR: runtime.stateDir },
  },
  urls() { return { healthUrl: `http://127.0.0.1:${port}/health` }; },
};
