import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { decide } from '../src/state.js';
import { createClient } from '../src/client.js';
import type { CardActionEvent } from '../src/types.js';

interface Input {
  directory: string;
  id: string;
  operation: 'decide' | 'invalidate';
  event: CardActionEvent;
  timeoutMs?: number;
  contended?: string;
  readMarker?: string;
  continueMarker?: string;
}
const input = JSON.parse(process.argv[2]!) as Input;
const originalRead = fs.readFileSync;
const originalMkdir = fs.mkdirSync;
const sleep = new Int32Array(new SharedArrayBuffer(4));
let paused = false;
// Expose actual filesystem scheduling points to the parent test. Business
// transitions still run through the production decide/invalidate APIs.
fs.mkdirSync = ((path, ...args) => {
  try { return Reflect.apply(originalMkdir, fs, [path, ...args]); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST'
        && String(path).endsWith('/request.lock') && input.contended) {
      fs.writeFileSync(input.contended, 'waiting');
    }
    throw error;
  }
}) as typeof fs.mkdirSync;
fs.readFileSync = ((path, ...args) => {
  const result = Reflect.apply(originalRead, fs, [path, ...args]);
  if (!paused && input.readMarker && input.continueMarker
      && String(path) === resolve(input.directory, input.id, 'request.json')) {
    paused = true;
    fs.writeFileSync(input.readMarker, 'read');
    const deadline = Date.now() + 4000;
    while (!fs.existsSync(input.continueMarker)) {
      if (Date.now() >= deadline) throw new Error('Test scheduling barrier timed out');
      Atomics.wait(sleep, 0, 0, 5);
    }
  }
  return result;
}) as typeof fs.readFileSync;
syncBuiltinESMExports();
try {
  if (input.operation === 'decide') {
    const result = decide(input.directory, input.event, undefined, input.timeoutMs);
    console.log(JSON.stringify({ ok: true, status: result.request.status, repeated: result.repeated }));
  } else {
    const client = createClient({ directory: input.directory, run: async () => ({ success: true }) });
    const result = await client.invalidate(input.id);
    console.log(JSON.stringify({ ok: true, status: result.status }));
  }
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: (error as Error).message }));
  process.exitCode = 2;
} finally {
  fs.readFileSync = originalRead;
  fs.mkdirSync = originalMkdir;
  syncBuiltinESMExports();
}
