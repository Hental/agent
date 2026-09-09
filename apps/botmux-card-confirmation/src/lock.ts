import { existsSync, mkdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// Cross-process, per-request mutual exclusion for read-check-write transactions.
// mkdir is atomic on POSIX: whoever creates the lock directory holds the lock.
// A crashed holder may leave a stale lock behind; it is NEVER stolen or deleted
// by another process. Recovery is fail-closed: wait bounded time, then fail
// explicitly. Manual cleanup is required afterwards, and only after confirming
// the original process has exited.
export const LOCK_POLL_MS = 5;
export const LOCK_TIMEOUT_MS = 1500;

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const sleep = new Int32Array(new SharedArrayBuffer(4));

export class RequestLockError extends Error {}

export interface RequestLock {
  release(): void;
}

interface LockOwner {
  pid: number;
  token: string;
  createdAt: string;
}

const activeReleases = new Set<() => void>();
let exitHookRegistered = false;

export function acquireRequestLock(dir: string, id: string, timeoutMs = LOCK_TIMEOUT_MS): RequestLock {
  if (!REQUEST_ID_PATTERN.test(id ?? '')) throw new Error('Invalid request ID');
  const requestDir = join(dir, id);
  const lockDir = join(requestDir, 'request.lock');
  const ownerPath = join(lockDir, 'owner.json');
  const owner: LockOwner = { pid: process.pid, token: randomUUID(), createdAt: new Date().toISOString() };
  const deadline = Date.now() + timeoutMs;
  mkdirSync(requestDir, { recursive: true, mode: 0o700 });
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) {
        throw new RequestLockError(
          `Request ${id} is locked by another process and the bounded wait of ${timeoutMs}ms elapsed; `
          + `the state change was NOT applied. If ${lockDir} is a leftover from a crashed process, `
          + 'confirm that process has exited, then remove the lock directory manually.',
        );
      }
      Atomics.wait(sleep, 0, 0, LOCK_POLL_MS);
    }
  }
  writeFileSync(ownerPath, JSON.stringify(owner), { mode: 0o600 });
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    activeReleases.delete(release);
    try {
      // Remove only our own lock: never delete another process's lock.
      if (!existsSync(ownerPath)) return;
      const current = JSON.parse(readFileSync(ownerPath, 'utf8')) as LockOwner;
      if (current.token !== owner.token) return;
      rmSync(ownerPath, { force: true });
      rmdirSync(lockDir);
    } catch {
      // Leave the lock for fail-closed manual recovery rather than risk
      // removing state owned by someone else.
    }
  };
  activeReleases.add(release);
  if (!exitHookRegistered) {
    exitHookRegistered = true;
    process.once('exit', () => { for (const active of [...activeReleases]) active(); });
  }
  return { release };
}
