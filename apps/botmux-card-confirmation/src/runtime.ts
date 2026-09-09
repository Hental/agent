import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RuntimeConfig } from './types.js';

let cached: RuntimeConfig | null = null;

// In built bundles ./runtime.json sits next to the chunk and carries the
// absolute state directory. Both src/ and dist/ chunks are exactly one level
// below the app root, so the source-development fallback resolves the same
// project-root .reports directory (never apps/.reports or dist/.reports).
export function loadRuntime(): RuntimeConfig {
  if (cached) return cached;
  const here = import.meta.dirname;
  const bundled = resolve(here, './runtime.json');
  if (existsSync(bundled)) {
    cached = JSON.parse(readFileSync(bundled, 'utf8')) as RuntimeConfig;
    return cached;
  }
  // No bundled runtime.json: either the TypeScript sources (development and
  // unit tests) or a damaged copied/installed bundle. The build marks
  // dist/package.json, so a marked bundle must fail loudly instead of
  // silently selecting a new unrelated state directory.
  const packagePath = resolve(here, './package.json');
  const isBuiltBundle = existsSync(packagePath)
    && (JSON.parse(readFileSync(packagePath, 'utf8')) as Record<string, unknown>).botmuxPluginCardConfirmation !== undefined;
  if (isBuiltBundle) {
    throw new Error('Bundled card-confirmation distribution is missing dist/runtime.json; rebuild with `pnpm run build`');
  }
  cached = { stateDir: resolve(here, '../../../.reports/botmux-card-confirmation'), node: process.execPath };
  return cached;
}
