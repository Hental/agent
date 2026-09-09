import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const dist = resolve(root, 'dist');
rmSync(dist, { recursive: true, force: true });
cpSync(resolve(root, 'src'), dist, { recursive: true });
mkdirSync(resolve(dist, 'card-actions'), { recursive: true });
writeFileSync(resolve(dist, 'package.json'), JSON.stringify({ type: 'module' }));
writeFileSync(resolve(dist, 'runtime.json'), JSON.stringify({
  stateDir: resolve(root, '../../.reports/botmux-card-confirmation'),
  node: process.execPath,
}));
writeFileSync(resolve(dist, 'card-actions/index.json'), JSON.stringify({
  schemaVersion: 1, actions: ['card_confirmation_decide'], endpoint: '/card-action',
}));
console.log('Built card-confirmation');
