import { parseArgv } from 'zx';

export class UsageError extends Error {}
export interface Options { [key: string]: string | boolean | undefined }
export const globalOptions = ['profile', 'timeout', 'output-format', 'prompt', 'session'];
export const commandOptions: Record<string, string[]> = {
  'auth capture': ['request-id', 'completion-id'], 'auth status': ['request-id', 'completion-id'],
  'sessions list': ['limit', 'cursor', 'pin-query-type', 'all', 'search'],
  'sessions get': [], 'sessions messages': ['limit', 'anchor', 'all', 'direction'],
  'sessions create': ['prompt', 'title'], 'sessions send': ['prompt'],
  'sessions rename': [], 'sessions delete': ['yes'],
};
const booleans = ['help', 'all', 'yes'];

// Validate tokens before zx/minimist: unknown flags and absent values must never
// silently become positional arguments, booleans, or a destructive operation.
export function parseOptions(tokens: string[], allowed: string[], stopEarly = false) {
  const normalized: string[] = [], rest: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token === '--') { rest.push(...tokens.slice(i + 1)); break; }
    if (!token.startsWith('-') || token === '-') {
      if (stopEarly) { rest.push(...tokens.slice(i)); break; }
      rest.push(token); continue;
    }
    const match = /^(?:--([\w-]+)|-([ph]))(?:=(.*))?$/s.exec(token);
    const key = match?.[1] ?? (match?.[2] === 'p' ? 'prompt' : match?.[2] === 'h' ? 'help' : undefined);
    if (!key || (key !== 'help' && !allowed.includes(key))) throw new UsageError(`Unknown option: ${token}`);
    if (seen.has(key)) throw new UsageError(`Repeated option: --${key}`);
    seen.add(key);
    if (booleans.includes(key)) {
      if (match?.[3] !== undefined) throw new UsageError(`--${key} does not accept a value`);
      normalized.push(`--${key}`);
    } else {
      let value = match?.[3];
      if (value === undefined) {
        value = tokens[++i];
        if (value === undefined || value.startsWith('-')) throw new UsageError(`--${key} requires a value (use --${key}=VALUE for leading hyphens)`);
      }
      normalized.push(`--${key}=${value}`);
    }
  }
  const parsed = parseArgv(normalized, { string: allowed.filter(k => !booleans.includes(k)),
    boolean: booleans, camelCase: false, parseBoolean: false });
  const options: Options = {};
  for (const key of seen) options[key] = parsed[key];
  return { options, rest };
}
export function decimal(value: string): string {
  if (!/^\d+$/.test(value)) throw new UsageError('ID or cursor must be a decimal string');
  return value;
}
export function positive(value: string): number {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
    throw new UsageError('Expected a positive safe integer');
  }
  return Number(value);
}
export function choice(value: string, choices: string[]): string {
  if (!choices.includes(value)) throw new UsageError(`Expected one of: ${choices.join(', ')}`);
  return value;
}
