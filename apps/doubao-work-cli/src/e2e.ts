#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PROFILE, parseJSON, savePrivate } from './client';
import { parseOptions, positive, UsageError } from './args';

// Run the actual executable as a child: no mocked transport or direct Client calls.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const executable = join(root, 'apps/doubao-work-cli/doubao-work');
const parsed = parseOptions(process.argv.slice(2), ['profile', 'timeout']);
if (parsed.rest.length) throw new UsageError('E2E accepts only --profile and --timeout');
if (parsed.options.help) {
  console.log('Usage: pnpm run doubao-work:e2e [--profile PATH] [--timeout SECONDS]\nUses live credentials, creates one text-only session, then deletes only that session.');
} else {
  await run(String(parsed.options.profile ?? DEFAULT_PROFILE), positive(String(parsed.options.timeout ?? '180')));
}

async function run(profile: string, timeout: number): Promise<void> {
  const runId = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const reportDir = join(root, '.reports/doubao-work-cli/e2e', runId);
  const reportPath = join(reportDir, 'result.json');
  await mkdir(reportDir, { recursive: true, mode: 0o700 });
  const marker = `E2E_${randomUUID().slice(0, 8).toUpperCase()}`;
  const title = `doubao-work-e2e-${runId}`;
  let session: string | undefined;
  let createAttempted = false;
  let interrupted = false;
  let active: ReturnType<typeof spawn> | undefined;
  let cleaning = false;
  const report: {
    run_id: string; started_at: string; finished_at?: string; ok: boolean;
    session_id?: string; steps: { name: string; ok: boolean; duration_ms: number; error?: string }[];
    cleanup: string; error?: string;
  } = { run_id: runId, started_at: new Date().toISOString(), ok: false, steps: [], cleanup: 'not-needed' };
  const persist = () => savePrivate(reportPath, report);
  // No prompts, credentials, full conversations, or raw API responses in artifacts.
  const interrupt = () => { interrupted = true; if (!cleaning) active?.kill('SIGINT'); };
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);

  async function cli(args: string[], format = 'json', expectedExit = 0, trackCreation = false): Promise<any> {
    if (interrupted && !cleaning) throw new Error('E2E interrupted');
    return new Promise((resolveResult, reject) => {
      const child = spawn(executable, ['--profile', profile, '--timeout', String(timeout), '--output-format', format, ...args],
        { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      active = child;
      let stdout = '', stderr = '', pending = '', expired = false;
      const timer = setTimeout(() => { expired = true; child.kill('SIGKILL'); }, (timeout + 15) * 1000);
      function remember(value: any) {
        if (trackCreation && /^\d+$/.test(String(value?.session_id ?? ''))) {
          const id = String(value.session_id);
          if (session && session !== id) throw new Error('Creation returned conflicting session IDs');
          session = id; report.session_id = id; report.cleanup = 'pending';
        }
      }
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
        if (trackCreation) {
          pending += chunk;
          let newline: number;
          while ((newline = pending.indexOf('\n')) >= 0) {
            const line = pending.slice(0, newline); pending = pending.slice(newline + 1);
            try { remember(parseJSON(line)); } catch { /* Final parsing rejects malformed output. */ }
          }
        }
      });
      child.stderr.on('data', (chunk: string) => { stderr += chunk; });
      child.once('error', () => {
        clearTimeout(timer); active = undefined; reject(new Error('Could not launch CLI executable'));
      });
      child.once('close', (code) => {
        clearTimeout(timer); active = undefined;
        // The CLI includes the acknowledged ID when a create stream fails.
        if (trackCreation && !session) {
          const match = /session=(\d+)/.exec(stderr);
          if (match) remember({ session_id: match[1] });
        }
        if (expired || code !== expectedExit) {
          reject(new Error(expired ? 'CLI process deadline exceeded' : `CLI exited ${code}; expected ${expectedExit}`)); return;
        }
        if (expectedExit !== 0) { resolveResult(undefined); return; }
        try {
          if (format === 'stream-json') {
            const events = stdout.trim().split('\n').map(line => parseJSON(line));
            events.forEach(remember);
            assert(events.some(event => event.type === 'session'), 'Missing session event');
            const result = events.at(-1);
            assert.equal(result?.type, 'result', 'Missing final result event');
            resolveResult(result);
          } else resolveResult(parseJSON(stdout));
        } catch { reject(new Error('Invalid CLI result or missing stream events')); }
      });
    });
  }
  async function step(name: string, action: () => Promise<void>) {
    const start = Date.now();
    try {
      await action();
      report.steps.push({ name, ok: true, duration_ms: Date.now() - start });
      console.log(`PASS ${name}`);
    } catch (error) {
      // AssertionError messages can contain actual response contents; do not save them.
      const message = error instanceof assert.AssertionError ? 'Response assertion failed'
        : error instanceof Error ? error.message : 'Step failed';
      report.steps.push({ name, ok: false, duration_ms: Date.now() - start, error: message });
      throw new Error(`${name}: ${message}`);
    } finally { await persist(); }
  }
  const sid = () => { assert(session, 'Missing created session ID'); return session; };
  try {
    await step('auth status', async () => { assert.equal((await cli(['auth', 'status'])).authenticated, true); });
    await step('create through SSE', async () => {
      createAttempted = true;
      const result = await cli(['sessions', 'create', '-p', `这是临时文本测试。请只回复下一行标记，不加解释、标点或 Markdown，不调用工具、不读取文件：\n${marker}`, '--title', title], 'stream-json', 0, true);
      if (result.session_id !== sid()) throw new Error('Created result session ID mismatch');
      if (result.finished !== true) throw new Error('Completion did not finish');
      if (result.text.trim() !== marker) throw new Error(`Reply marker mismatch (reply length=${result.text.trim().length}, contains marker=${result.text.includes(marker)})`);
    });
    await step('get title and active status', async () => {
      const result = await cli(['sessions', 'get', sid()]);
      assert.equal(String(result.conversation_id), sid()); assert.equal(result.name, title); assert.equal(result.status, 1);
    });
    await step('list and title search', async () => {
      const result = await cli(['sessions', 'list', '--all', '--search', title]);
      assert.equal(result.has_more, false);
      assert(result.sessions.some((item: any) => String(item.conversation_id) === sid() && item.name === title));
    });
    await step('history pagination', async () => {
      const result = await cli(['sessions', 'messages', sid(), '--all', '--limit', '1']);
      assert.equal(result.has_more, false); assert(result.messages.length >= 2);
      assert.equal(new Set(result.messages.map((item: any) => String(item.message_id))).size, result.messages.length);
    });
    await step('root prompt continues context', async () => {
      const result = await cli(['--session', sid(), '-p', '请只原样重复上一条回复的标记，不加解释、标点或 Markdown，不调用工具、不读取文件。'], 'stream-json');
      assert.equal(result.session_id, sid()); assert.equal(result.finished, true); assert.equal(result.text.trim(), marker);
    });
    await step('rename and read back', async () => {
      assert.equal((await cli(['sessions', 'rename', sid(), `${title}-renamed`])).ok, true);
      assert.equal((await cli(['sessions', 'get', sid()])).name, `${title}-renamed`);
    });
    await step('delete requires --yes', async () => {
      await cli(['sessions', 'delete', sid()], 'json', 2);
      assert.equal((await cli(['sessions', 'get', sid()])).status, 1);
    });
  } catch (error) { report.error = error instanceof Error ? error.message : 'E2E failed'; }
  finally {
    cleaning = true;
    if (session) {
      try {
        await step('delete owned session and verify', async () => {
          assert.equal((await cli(['sessions', 'delete', sid(), '--yes'])).deleted, true);
          assert.equal((await cli(['sessions', 'get', sid()])).status, 2);
          // Search prefix includes both original and renamed titles; match by ID.
          const result = await cli(['sessions', 'list', '--all', '--search', title]);
          assert.equal(result.has_more, false);
          assert(!result.sessions.some((item: any) => String(item.conversation_id) === sid()));
        });
        report.cleanup = 'verified-deleted';
      } catch { report.cleanup = 'failed-check-session-manually'; }
    } else if (createAttempted) report.cleanup = 'unknown-create-outcome-no-session-id';
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    report.ok = !interrupted && !report.error && report.cleanup === 'verified-deleted' && report.steps.every(item => item.ok);
    report.finished_at = new Date().toISOString();
    await persist();
    console.log(`Report: ${reportPath}`);
    if (!report.ok) {
      console.error(`FAIL ${report.error ?? (interrupted ? 'Interrupted' : report.cleanup)}; cleanup=${report.cleanup}${session ? `; session=${session}` : ''}`);
      process.exitCode = 1;
    }
  }
}
