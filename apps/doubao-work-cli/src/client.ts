import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { parse, stringify } from 'lossless-json';

// The private service has extensible JSON bodies; known application boundaries are typed below.
export type WireObject = Record<string, any>;
export interface Profile {
  schema_version: 1;
  headers: Record<string, string>;
  query: Record<string, string>;
  captured_at?: number;
  completion_query?: Record<string, string>;
  completion_template?: WireObject;
}
export interface Conversation extends WireObject {
  conversation_id: string;
  status: number;
  name: string;
  msg_cursor?: string | number | bigint;
  last_section_id?: string;
  extra?: string;
}
export interface CompletionResult {
  session_id: string;
  text: string;
  finished: true;
  name?: string;
}
export class ClientError extends Error {}
export const ORIGIN = 'https://www.doubao.com';
export const DEFAULT_PROFILE = join(homedir(), '.config/doubao-work-cli/profile.json');
const execFileAsync = promisify(execFile);
export const expandHome = (path: string): string => path.startsWith('~/') ? join(homedir(), path.slice(2)) : path;

// Preserve integer tokens before Number conversion, including SSE's unquoted 64-bit IDs.
export function parseJSON(text: string): any {
  return parse(text, undefined, (token: string) => {
    if (/^-?\d+$/.test(token)) {
      const integer = BigInt(token);
      return integer >= BigInt(Number.MIN_SAFE_INTEGER) && integer <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(integer) : integer;
    }
    return Number(token);
  });
}
export function dumps(value: unknown): string {
  const result = stringify(value);
  if (result === undefined) throw new ClientError('Value is not serializable JSON.');
  return result;
}
export function emit(value: unknown): void { console.log(dumps(value)); }
export function object(value: unknown): WireObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ClientError('Unsupported profile or API response shape.');
  }
  return value as WireObject;
}
export function decimal(value: string): string {
  if (!/^\d+$/.test(value)) throw new ClientError('ID or cursor must be a decimal string.');
  return value;
}
export function wireInteger(value: string | number | bigint): bigint {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new ClientError('Unsafe numeric cursor; supply the exact decimal string.');
  }
  return BigInt(decimal(String(value)));
}
export async function savePrivate(path: string, value: unknown): Promise<void> {
  path = expandHome(path);
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temp, 'wx', 0o600);
    try { await file.writeFile(dumps(value) + '\n'); } finally { await file.close(); }
    await rename(temp, path);
  } finally { await unlink(temp).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; }); }
}
export async function loadProfile(path: string): Promise<Profile> {
  let profile: WireObject;
  try { profile = object(parseJSON(await readFile(expandHome(path), 'utf8'))); }
  catch { throw new ClientError('No valid profile. Run: doubao-work auth capture'); }
  if (profile.schema_version !== 1 || !profile.headers?.cookie || !profile.query) {
    throw new ClientError('Invalid profile; run auth capture again.');
  }
  return profile as Profile;
}
export async function bifrost(...args: string[]): Promise<WireObject> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync('bifrost', args, { timeout: 40_000, maxBuffer: 8 * 1024 * 1024 }));
  } catch { throw new ClientError('Bifrost capture failed; check bifrost status --format json.'); }
  try { return object(parseJSON(stdout)); }
  catch { throw new ClientError('Bifrost returned invalid JSON.'); }
}
export function decodeCapture(result: WireObject): {
  path: string; headers: Record<string, string>; query: Record<string, string>; body: WireObject;
} {
  if (!result.ok) throw new ClientError('Captured request is unavailable.');
  const record = object(result.record);
  const url = new URL(record.url);
  if (url.origin !== ORIGIN || url.username || url.password) {
    throw new ClientError('Only HTTPS requests to www.doubao.com are accepted.');
  }
  if (record.method !== 'POST') throw new ClientError('Expected a captured POST request.');
  const part = result.bodies?.request;
  if (!part?.bytes_b64 || part.truncated) throw new ClientError('Captured request body is missing or truncated.');
  let body: WireObject;
  try { body = object(parseJSON(Buffer.from(part.bytes_b64, 'base64').toString('utf8'))); }
  catch { throw new ClientError('Captured request body is invalid.'); }
  const allowed = new Set(['cookie', 'user-agent', 'content-type', 'agw-js-conv', 'referer', 'x-secsdk-csrf-token']);
  const pairs: [string, string][] = Array.isArray(record.request_headers)
    ? record.request_headers : Object.entries(record.request_headers);
  const headers = Object.fromEntries(
    pairs.map((pair): [string, string] => [String(pair[0]).toLowerCase(), pair[1]])
      .filter(([key]) => allowed.has(key)));
  for (const key of ['a_bogus', 'X-Bogus', 'msToken']) url.searchParams.delete(key);
  const query = Object.fromEntries(url.searchParams);
  if (query.aid !== '1044603') throw new ClientError('Expected Doubao Work aid=1044603, not the consumer app.');
  if (!headers.cookie) throw new ClientError('No login cookie in capture; log in to Doubao Work first.');
  return { path: url.pathname, headers, query, body };
}
async function captured(id: string) {
  const data = await bifrost('traffic', 'get', '--ids', id, '--request-body', '--max-body', '2000000', '--format', 'json');
  return decodeCapture(data.results[0]);
}
async function latestCapture(path: string): Promise<string> {
  const data = await bifrost('traffic', 'list', '--host', 'www.doubao.com', '--path', path,
    '--method', 'POST', '--status', '200', '--limit', '50', '--format', 'json');
  const item = data.records?.find((r: WireObject) => r.p?.split('?')[0] === path && r.capp?.includes('DoubaoWork'));
  if (!item) throw new ClientError(`No Doubao Work capture for ${path}; open the app and send a short test prompt.`);
  return String(item.id);
}
export async function captureProfile(path: string, requestId?: string, completionId?: string) {
  const auth = await captured(requestId ?? await latestCapture('/im/conversation/info'));
  if (!auth.path.startsWith('/im/')) throw new ClientError('Authentication capture must be an /im/ request.');
  const completion = await captured(completionId ?? await latestCapture('/chat/completion'));
  if (completion.path !== '/chat/completion') throw new ClientError('Completion capture must be /chat/completion.');
  const template = completion.body;
  if (['is_regen', 'is_replace', 'is_select_text'].some((key) => template.option?.[key])) {
    throw new ClientError('Capture an ordinary text prompt, not a regeneration or edit.');
  }
  template.messages = [];
  template.user_context = [];
  const profile: Profile = { schema_version: 1, headers: auth.headers, query: auth.query,
    captured_at: Math.floor(Date.now() / 1000), completion_query: completion.query, completion_template: template };
  await savePrivate(path, profile);
  return { ok: true, profile: expandHome(path), captured_at: profile.captured_at };
}
export function envelope(cmd: number, key: string, value: WireObject): WireObject {
  return { cmd, uplink_body: { [key]: value }, sequence_id: randomUUID(), channel: 2, version: '1' };
}
export function checkResponse(value: unknown): WireObject {
  const data = object(value);
  if (data.status_code === undefined) throw new ClientError('Unexpected API response (missing status_code).');
  if (String(data.status_code) !== '0') {
    throw new ClientError(`Doubao API status ${data.status_code}; verify login and conversation ID.`);
  }
  return object(data.downlink_body ?? {});
}

export class Client {
  constructor(public readonly profile: Profile, public readonly timeout = 180,
    private readonly fetcher: typeof fetch = fetch) {}

  async request(path: string, body: WireObject, completion = false, signal?: AbortSignal): Promise<Response> {
    const query = completion ? this.profile.completion_query : this.profile.query;
    const url = `${ORIGIN}${path}?${new URLSearchParams(query)}`;
    let response: Response;
    try {
      response = await this.fetcher(url, { method: 'POST', redirect: 'error',
        headers: { ...this.profile.headers, 'content-type': 'application/json; encoding=utf-8' },
        body: dumps(body), signal: signal ?? AbortSignal.timeout(this.timeout * 1000) });
    } catch { throw new ClientError('Request failed or timed out. Check session state before retrying a write.'); }
    if (!response.ok) {
      await response.body?.cancel();
      throw new ClientError(`HTTP ${response.status}; refresh auth if expired. No automatic retry.`);
    }
    return response;
  }

  async im(path: string, cmd: number, key: string, value: WireObject, downlink?: string): Promise<WireObject> {
    const response = await this.request(path, envelope(cmd, key, value));
    let parsed: unknown;
    try { parsed = parseJSON(await response.text()); }
    catch { throw new ClientError('Expected JSON from Doubao; login may have expired or the request timed out.'); }
    const data = checkResponse(parsed);
    if (downlink && !(downlink in data)) throw new ClientError('Expected API response body was absent.');
    return downlink ? object(data[downlink]) : data;
  }

  async info(session: string): Promise<Conversation> {
    const data = await this.im('/im/conversation/info', 1110, 'get_conv_info_uplink_body',
      { conversation_id: decimal(session), conversation_type: 3, bot_id: '', option: { need_bot_info: true }, ext: {} },
      'get_conv_info_downlink_body');
    if (!data.conversation_info) throw new ClientError('Conversation not found or inaccessible.');
    return object(data.conversation_info) as Conversation;
  }

  async listPage(limit = 20, cursor = '0', pinQueryType = wireInteger(cursor) === 0n ? 0 : 1): Promise<WireObject> {
    return this.im('/im/chain/recent_conv', 3200, 'pull_recent_conv_chain_uplink_body',
      { limit, message_count_per_conv: 0, api_version: 1, conv_version: wireInteger(cursor),
        direction: wireInteger(cursor) === 0n ? 3 : 1,
        option: { not_need_message: true, need_complete_conversation: true, need_coco_conversation: false,
          need_coco_bot: false, need_pc_pin_chain: true, pc_pin_query_type: pinQueryType,
          exclude_archive: true, only_archive: false } }, 'pull_recent_conv_chain_downlink_body');
  }

  async sessions(limit = 20, cursor = '0', allPages = false, search?: string,
    pinQueryType = wireInteger(cursor) === 0n ? 0 : 1): Promise<WireObject> {
    const result: WireObject[] = [], seen = new Set<string>(), cursors = new Set<string>();
    let hasMore: boolean;
    do {
      const marker = `${cursor}:${pinQueryType}`;
      if (cursors.has(marker)) throw new ClientError('Pagination cursor repeated; refusing an infinite loop.');
      cursors.add(marker);
      const page = await this.listPage(limit, cursor, pinQueryType);
      for (const cell of page.cells ?? []) {
        const conv = cell.conversation;
        const sid = conv?.conversation_id === undefined ? '' : String(conv.conversation_id);
        if (sid && !seen.has(sid)) { seen.add(sid); result.push({ ...conv, conversation_id: sid }); }
      }
      cursor = String(page.next_conv_version ?? '');
      pinQueryType = page.extra?.pc_pin_query_type ?? pinQueryType;
      hasMore = Boolean(page.has_more);
      if (allPages && hasMore && !cursor) throw new ClientError('API reports more pages without a cursor.');
    } while (allPages && hasMore);
    return { sessions: search ? result.filter((c) => (c.name ?? '').toLowerCase().includes(search.toLowerCase())) : result,
      next_cursor: cursor, next_pin_query_type: pinQueryType, has_more: hasMore };
  }

  async messages(session: string, limit = 20, anchor = '0', direction = 2): Promise<WireObject> {
    return this.im('/im/chain/single', 3100, 'pull_singe_chain_uplink_body',
      { conversation_id: decimal(session), conversation_type: 3, anchor_index: wireInteger(anchor), direction,
        limit, ext: {}, filter: { index_list: [] }, evaluate_ab_params: '', evaluate_common_params: '' },
      'pull_singe_chain_downlink_body');
  }

  async history(session: string, limit = 20, anchor = '0', direction = 2, allPages = false): Promise<WireObject> {
    const messages = new Map<string, WireObject>(), cursors = new Set<string>();
    let page: WireObject;
    do {
      if (cursors.has(anchor)) throw new ClientError('Message pagination cursor repeated.');
      cursors.add(anchor);
      page = await this.messages(session, limit, anchor, direction);
      for (const message of page.messages ?? []) messages.set(String(message.message_id), message);
      anchor = String(page.next_index ?? '');
      if (allPages && page.has_more && !anchor) throw new ClientError('API reports more messages without an anchor.');
    } while (allPages && page.has_more);
    return { ...page, messages: [...messages.values()].sort((a, b) => {
      const left = wireInteger(a.index_in_conv), right = wireInteger(b.index_in_conv);
      return left < right ? -1 : left > right ? 1 : 0;
    }) };
  }

  async rename(session: string, title: string): Promise<WireObject> {
    if (!title.trim()) throw new ClientError('Title must not be empty.');
    await this.im('/im/conversation/update_name', 4150, 'update_conversation_name_uplink_body',
      { conversation_id: decimal(session), conversation_type: 3, name: title });
    const actual = (await this.info(session)).name;
    if (actual !== title) throw new ClientError('Rename was accepted but read-back did not match; inspect the session.');
    return { ok: true, session_id: session, name: actual };
  }

  async delete(session: string): Promise<WireObject> {
    await this.im('/im/conversation/batch_del_user_conv', 4171, 'batch_delete_user_conversation_uplink_body',
      { conversation_id: [decimal(session)], delete_all: false, conversation_type: 3 });
    if ((await this.info(session)).status !== 2) throw new ClientError('Delete was accepted but deleted status was not confirmed.');
    return { ok: true, session_id: session, deleted: true };
  }

  async send(prompt: string, session?: string, stream = false): Promise<CompletionResult> {
    const info = session ? await this.info(session) : undefined;
    const body = completionBody(this.profile, prompt, info);
    const state = new StreamState(session);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout * 1000);
    const interrupt = () => controller.abort();
    process.once('SIGINT', interrupt);
    try {
      const response = await this.request('/chat/completion', body, true, controller.signal);
      if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
        await response.body?.cancel();
        throw new ClientError('Completion did not return SSE; refresh login capture.');
      }
      for await (const [event, data] of sseEvents(response.body)) {
        state.apply(event, data);
        if (stream && event === 'SSE_ACK') emit({ type: 'session', session_id: state.session });
        else if (stream && event === 'STREAM_CHUNK' && state.lastText) emit({ type: 'text_delta', text: state.lastText });
        if (state.finished) break;
      }
      if (!state.finished || !state.session) throw new ClientError('Incomplete completion stream.');
      return { session_id: state.session, text: state.text(), finished: true };
    } catch (error) {
      const reason = error instanceof ClientError ? error.message : 'Stream interrupted or timed out.';
      throw new ClientError(`${reason} session=${state.session ?? 'unknown'}. Check state before retrying.`);
    } finally {
      clearTimeout(timer);
      process.removeListener('SIGINT', interrupt);
      controller.abort();
    }
  }
}

export function completionBody(profile: Profile, prompt: string, info?: Conversation): WireObject {
  if (!prompt.trim()) throw new ClientError('Prompt must not be empty.');
  if (!profile.completion_template) throw new ClientError('No completion template; run auth capture.');
  const body = structuredClone(profile.completion_template);
  if (info && info.status !== 1) throw new ClientError('Cannot continue an inactive or deleted conversation.');
  const messageId = randomUUID();
  Object.assign(object(body.client_meta), { local_conversation_id: `local_${randomUUID().replaceAll('-', '')}`,
    conversation_id: info ? String(info.conversation_id) : '', last_section_id: info?.last_section_id ?? '',
    last_message_index: info ? wireInteger(info.msg_cursor ?? '0') : null });
  body.messages = [{ local_message_id: messageId, message_status: 0, content_block: [{ block_type: 10000,
    block_id: randomUUID(), parent_id: '', content: { text_block: { text: prompt } }, meta_info: [], append_fields: [] }] }];
  const option = object(body.option);
  Object.assign(option, { create_time_ms: Date.now(), unique_key: randomUUID(), need_create_conversation: !info,
    start_seq: 0, recovery_option: { is_recovery: false, req_create_time_sec: Math.floor(Date.now() / 1000), append_sse_event_scene: 0 } });
  const task = option.general_task_param ??= {};
  task.thread_local_message_id = [messageId];
  if (info) {
    const extra = object(parseJSON(info.extra || '{}'));
    const agent = object(parseJSON(extra.agent_task_param || '{}'));
    if (Object.keys(agent).length) {
      const capturedAgent = task.agent_task_param ?? {};
      for (const key of ['local_device_id', 'workspace', 'runtime_type']) {
        if (agent[key] !== capturedAgent[key]) throw new ClientError('Session runtime differs from capture. Capture a prompt from this session first.');
      }
    }
    for (const key of ['model_item_key', 'reasoning_effort', 'mode_id']) {
      if (key in extra && String(extra[key]) !== String(option.conversation_init_ext?.[key])) {
        throw new ClientError('Session model differs from capture. Capture a prompt from this session first.');
      }
    }
  }
  (body.ext ??= {}).general_task_param = dumps(task);
  body.user_context = [];
  return body;
}

// Network chunks may split UTF-8 characters, lines, CRLF pairs, or complete events.
export async function* sseEvents(chunks: AsyncIterable<Uint8Array>): AsyncGenerator<[string, WireObject]> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '', event = '', data: string[] = [];
  for await (const chunk of chunks) {
    pending += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = pending.indexOf('\n')) !== -1) {
      const line = pending.slice(0, newline).replace(/\r$/, '');
      pending = pending.slice(newline + 1);
      if (!line) {
        if (data.length) {
          let parsed: WireObject;
          try { parsed = object(parseJSON(data.join('\n'))); }
          catch { throw new ClientError('Invalid JSON in completion stream.'); }
          yield [event, parsed];
        }
        event = ''; data = [];
      } else if (line.startsWith('event:')) event = line.slice(6).trimStart();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
  }
  pending += decoder.decode();
  if (data.length || pending.trim()) throw new ClientError('Truncated SSE event.');
}

export class StreamState {
  readonly blocks = new Map<string, string>();
  finished = false;
  lastText = '';
  constructor(public session?: string) {}
  apply(event: string, data: WireObject): void {
    this.lastText = '';
    if (event === 'SSE_ACK' && data.ack_client_meta?.conversation_id !== undefined) {
      this.session = String(data.ack_client_meta.conversation_id);
    } else if (event === 'STREAM_ERROR') throw new ClientError('Completion STREAM_ERROR.');
    else if (event === 'SSE_REPLY_END' && data.end_type === 3) this.finished = true;
    else if (event === 'FULL_MSG_NOTIFY' && data.message?.user_type === 2) {
      const message = data.message;
      for (const block of message.content_block ?? []) {
        const value = block.content?.text_block?.text;
        if (block.block_type === 10000 && !block.parent_id && value !== undefined) {
          this.blocks.set(`${message.message_id ?? ''}:${block.block_id}`, value);
        }
      }
    } else if (event === 'STREAM_CHUNK') {
      for (const op of data.patch_op ?? []) for (const block of op.patch_value?.content_block ?? []) {
        if (block.parent_id || block.block_type !== 10000) continue;
        const value = block.content?.text_block?.text;
        if (value === undefined) continue;
        const key = `${data.message_id ?? ''}:${block.block_id}`;
        if ((block.patch_type ?? op.patch_type) === 2) this.blocks.set(key, value);
        else { this.blocks.set(key, (this.blocks.get(key) ?? '') + value); this.lastText += value; }
      }
    }
  }
  text(): string { return [...this.blocks.values()].join('\n'); }
}
