import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { stateDir } from '../src/client.js';
import { loadRuntime } from '../src/runtime.js';

const projectRoot = resolve(import.meta.dirname, '../../..');

test('source client resolves the project-root state directory, not apps/.reports', () => {
  assert.equal(stateDir, resolve(projectRoot, '.reports/botmux-card-confirmation'));
  assert.equal(loadRuntime().stateDir, stateDir);
  assert.equal(stateDir.includes('/apps/.reports'), false);
});
