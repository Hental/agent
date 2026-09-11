#!/usr/bin/env python3
"""Non-interactive Doubao Work conversation client (Python standard library)."""
import argparse
import base64
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


ORIGIN = 'https://www.doubao.com'
DEFAULT_PROFILE = Path.home() / '.config/doubao-work-cli/profile.json'


class ClientError(Exception):
    pass


def dumps(value):
    return json.dumps(value, ensure_ascii=False)


def emit(value):
    print(dumps(value), flush=True)


def save_private(path, value):
    path = Path(path).expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    try:
        fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as out:
            out.write(dumps(value) + '\n')
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def bifrost(*args):
    try:
        p = subprocess.run(['bifrost', *args], capture_output=True, text=True,
                           timeout=40, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise ClientError('Bifrost unavailable; start Bifrost and capture a Doubao Work request.') from None
    if p.returncode:
        raise ClientError('Bifrost capture failed; check bifrost status --format json.')
    try:
        return json.loads(p.stdout)
    except ValueError:
        raise ClientError('Bifrost returned invalid JSON.') from None


def captured(record_id):
    result = bifrost('traffic', 'get', '--ids', str(record_id), '--request-body',
                     '--max-body', '2000000', '--format', 'json')['results'][0]
    if not result.get('ok'):
        raise ClientError('Captured request is unavailable.')
    record = result['record']
    url = urllib.parse.urlsplit(record['url'])
    if url.scheme != 'https' or url.netloc != 'www.doubao.com':
        raise ClientError('Only HTTPS requests to www.doubao.com are accepted.')
    if record.get('method') != 'POST':
        raise ClientError('Expected a captured POST request.')
    part = result.get('bodies', {}).get('request', {})
    if part.get('truncated'):
        raise ClientError('Captured request body was truncated.')
    try:
        body = json.loads(base64.b64decode(part['bytes_b64']))
    except (KeyError, ValueError):
        raise ClientError('Captured request body is missing or invalid.') from None
    headers = record['request_headers']
    headers = headers.items() if isinstance(headers, dict) else headers
    allowed = {'cookie', 'user-agent', 'content-type', 'agw-js-conv', 'referer',
               'x-secsdk-csrf-token'}
    headers = {k.lower(): v for k, v in headers if k.lower() in allowed}
    query = {k: v for k, v in urllib.parse.parse_qsl(url.query)
             if k not in {'a_bogus', 'X-Bogus', 'msToken'}}
    if query.get('aid') != '1044603':
        raise ClientError('Expected Doubao Work aid=1044603, not the consumer app.')
    if not headers.get('cookie'):
        raise ClientError('No login cookie in this capture; log in to Doubao Work first.')
    return url.path, headers, query, body


def latest_capture(path):
    data = bifrost('traffic', 'list', '--host', 'www.doubao.com', '--path', path,
                   '--method', 'POST', '--status', '200', '--limit', '50', '--format', 'json')
    for item in data.get('records', []):
        if item.get('p', '').split('?')[0] == path and 'DoubaoWork' in item.get('capp', ''):
            return item['id']
    raise ClientError(f'No Doubao Work capture for {path}; open the app and send a short test prompt.')


def capture_profile(path, request_id=None, completion_id=None):
    request_id = request_id or latest_capture('/im/conversation/info')
    endpoint, headers, query, _ = captured(request_id)
    if not endpoint.startswith('/im/'):
        raise ClientError('Authentication capture must be a conversation /im/ request.')
    profile = {'schema_version': 1, 'headers': headers, 'query': query,
               'captured_at': int(time.time())}
    completion_id = completion_id or latest_capture('/chat/completion')
    endpoint, _, completion_query, template = captured(completion_id)
    if endpoint != '/chat/completion':
        raise ClientError('Completion capture must be /chat/completion.')
    if any(template.get('option', {}).get(k) for k in ('is_regen', 'is_replace', 'is_select_text')):
        raise ClientError('Capture an ordinary text prompt, not a regeneration or edit.')
    # Store runtime configuration only: never persist the captured user's prompt.
    template['messages'] = []
    template['user_context'] = []
    profile.update(completion_query=completion_query, completion_template=template)
    save_private(path, profile)
    return {'ok': True, 'profile': str(Path(path).expanduser()), 'captured_at': profile['captured_at']}


def envelope(cmd, key, value):
    return {'cmd': cmd, 'uplink_body': {key: value}, 'sequence_id': str(uuid.uuid4()),
            'channel': 2, 'version': '1'}


def check_response(data):
    if not isinstance(data, dict) or 'status_code' not in data:
        raise ClientError('Unexpected API response (missing status_code).')
    if str(data['status_code']) != '0':
        raise ClientError(f"Doubao API status {data['status_code']}; verify login and conversation ID.")
    return data.get('downlink_body', {})


class Client:
    def __init__(self, profile, timeout=180):
        self.profile = profile
        self.timeout = timeout

    def request(self, path, body, completion=False):
        query = self.profile.get('completion_query' if completion else 'query', {})
        url = ORIGIN + path + '?' + urllib.parse.urlencode(query)
        headers = dict(self.profile['headers'])
        headers['content-type'] = 'application/json; encoding=utf-8'
        request = urllib.request.Request(url, data=dumps(body).encode(), headers=headers, method='POST')
        try:
            return urllib.request.urlopen(request, timeout=self.timeout)
        except urllib.error.HTTPError as e:
            raise ClientError(f'HTTP {e.code}; refresh auth capture if login expired. No automatic retry.') from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise ClientError('Request failed or timed out. Check session state before retrying a write.') from None

    def im(self, path, cmd, key, value, downlink=None):
        with self.request(path, envelope(cmd, key, value)) as response:
            try:
                data = check_response(json.load(response))
            except ValueError:
                raise ClientError('Expected JSON from Doubao; login may have expired.') from None
        if downlink:
            if downlink not in data:
                raise ClientError('Expected API response body was absent.')
            return data[downlink]
        return data

    def info(self, session):
        data = self.im('/im/conversation/info', 1110, 'get_conv_info_uplink_body',
                       {'conversation_id': session, 'conversation_type': 3, 'bot_id': '',
                        'option': {'need_bot_info': True}, 'ext': {}}, 'get_conv_info_downlink_body')
        if not data.get('conversation_info'):
            raise ClientError('Conversation not found or inaccessible.')
        return data['conversation_info']

    def list_page(self, limit=20, cursor='0', pin_query_type=None):
        if pin_query_type is None:
            pin_query_type = 0 if int(cursor) == 0 else 1
        return self.im('/im/chain/recent_conv', 3200, 'pull_recent_conv_chain_uplink_body',
                       {'limit': limit, 'message_count_per_conv': 0, 'api_version': 1,
                        'conv_version': int(cursor), 'direction': 3 if int(cursor) == 0 else 1,
                        'option': {'not_need_message': True, 'need_complete_conversation': True,
                                   'need_coco_conversation': False, 'need_coco_bot': False,
                                   'need_pc_pin_chain': True, 'pc_pin_query_type': pin_query_type,
                                   'exclude_archive': True, 'only_archive': False}},
                       'pull_recent_conv_chain_downlink_body')

    def sessions(self, limit=20, cursor='0', all_pages=False, search=None, pin_query_type=None):
        if pin_query_type is None:
            pin_query_type = 0 if int(cursor) == 0 else 1
        result, seen, cursors = [], set(), set()
        while True:
            marker = (cursor, pin_query_type)
            if marker in cursors:
                raise ClientError('Pagination cursor repeated; refusing an infinite loop.')
            cursors.add(marker)
            page = self.list_page(limit, cursor, pin_query_type)
            for cell in page.get('cells', []):
                conv = cell.get('conversation', {})
                sid = conv.get('conversation_id')
                if sid and sid not in seen:
                    seen.add(sid)
                    result.append(conv)
            cursor = str(page.get('next_conv_version', ''))
            pin_query_type = page.get('extra', {}).get('pc_pin_query_type', pin_query_type)
            has_more = bool(page.get('has_more'))
            if not all_pages or not has_more:
                break
            if not cursor:
                raise ClientError('API reports more pages without a cursor.')
        if search:
            result = [c for c in result if search.casefold() in c.get('name', '').casefold()]
        return {'sessions': result, 'next_cursor': cursor, 'next_pin_query_type': pin_query_type,
                'has_more': has_more}

    def messages(self, session, limit=20, anchor='0', direction=2):
        return self.im('/im/chain/single', 3100, 'pull_singe_chain_uplink_body',
                       {'conversation_id': session, 'conversation_type': 3, 'anchor_index': int(anchor),
                        'direction': direction, 'limit': limit, 'ext': {}, 'filter': {'index_list': []},
                        'evaluate_ab_params': '', 'evaluate_common_params': ''},
                       'pull_singe_chain_downlink_body')

    def history(self, session, limit=20, anchor='0', direction=2, all_pages=False):
        messages, cursors = {}, set()
        while True:
            if anchor in cursors:
                raise ClientError('Message pagination cursor repeated.')
            cursors.add(anchor)
            page = self.messages(session, limit, anchor, direction)
            for message in page.get('messages', []):
                messages[message['message_id']] = message
            anchor = str(page.get('next_index', ''))
            if not all_pages or not page.get('has_more'):
                break
            if not anchor:
                raise ClientError('API reports more messages without an anchor.')
        return {**page, 'messages': sorted(messages.values(), key=lambda m: int(m['index_in_conv']))}

    def rename(self, session, title):
        self.im('/im/conversation/update_name', 4150, 'update_conversation_name_uplink_body',
                {'conversation_id': session, 'conversation_type': 3, 'name': title})
        actual = self.info(session)['name']
        if actual != title:
            raise ClientError('Rename was accepted but read-back did not match; inspect the session.')
        return {'ok': True, 'session_id': session, 'name': actual}

    def delete(self, session):
        self.im('/im/conversation/batch_del_user_conv', 4171,
                'batch_delete_user_conversation_uplink_body',
                {'conversation_id': [session], 'delete_all': False, 'conversation_type': 3})
        if self.info(session).get('status') != 2:
            raise ClientError('Delete was accepted but deleted status was not confirmed.')
        return {'ok': True, 'session_id': session, 'deleted': True}

    def send(self, prompt, session=None, stream=False):
        info = self.info(session) if session else None
        body = completion_body(self.profile, prompt, info)
        state = StreamState(session)
        deadline = time.monotonic() + self.timeout
        with self.request('/chat/completion', body, completion=True) as response:
            if 'text/event-stream' not in response.headers.get('Content-Type', ''):
                raise ClientError('Completion did not return SSE; refresh login capture.')
            try:
                for event, data in sse_events(response):
                    if time.monotonic() > deadline:
                        raise ClientError(f'Completion timed out; session={state.session}. Check state before retrying.')
                    state.apply(event, data)
                    if stream:
                        # Expose stable public events, not raw cookies, runtime metadata or reasoning.
                        if event == 'SSE_ACK':
                            emit({'type': 'session', 'session_id': state.session})
                        elif event == 'STREAM_CHUNK' and state.last_text:
                            emit({'type': 'text_delta', 'text': state.last_text})
                    if state.finished:
                        break
            except (OSError, TimeoutError):
                raise ClientError(f'Stream interrupted; session={state.session}. Check state before retrying.') from None
        if not state.finished or not state.session:
            raise ClientError(f'Incomplete completion stream; session={state.session}. Check state before retrying.')
        return {'session_id': state.session, 'text': state.text(), 'finished': True}


def completion_body(profile, prompt, info=None):
    if not prompt.strip():
        raise ClientError('Prompt must not be empty.')
    body = copy.deepcopy(profile['completion_template'])
    if info and info.get('status') != 1:
        raise ClientError('Cannot continue an inactive or deleted conversation.')
    message_id = str(uuid.uuid4())
    meta = body['client_meta']
    meta.update(local_conversation_id='local_' + uuid.uuid4().hex,
                conversation_id=info['conversation_id'] if info else '',
                last_section_id=info.get('last_section_id', '') if info else '',
                last_message_index=int(info.get('msg_cursor', 0)) if info else None)
    body['messages'] = [{'local_message_id': message_id, 'message_status': 0,
                         'content_block': [{'block_type': 10000, 'block_id': str(uuid.uuid4()),
                                            'parent_id': '', 'content': {'text_block': {'text': prompt}},
                                            'meta_info': [], 'append_fields': []}]}]
    option = body['option']
    option.update(create_time_ms=int(time.time() * 1000), unique_key=str(uuid.uuid4()),
                  need_create_conversation=not bool(info), start_seq=0,
                  recovery_option={'is_recovery': False, 'req_create_time_sec': int(time.time()),
                                   'append_sse_event_scene': 0})
    task = option.get('general_task_param', {})
    task['thread_local_message_id'] = [message_id]
    if info:
        extra = json.loads(info.get('extra') or '{}')
        agent = json.loads(extra.get('agent_task_param') or '{}')
        if agent:
            # Never silently run a continuation in a different captured workspace/device.
            captured_agent = task.get('agent_task_param', {})
            for key in ('local_device_id', 'workspace', 'runtime_type'):
                if agent.get(key) != captured_agent.get(key):
                    raise ClientError('Session runtime differs from capture. Capture a prompt from this session first.')
        for key in ('model_item_key', 'reasoning_effort', 'mode_id'):
            if key in extra and str(extra[key]) != str(option.get('conversation_init_ext', {}).get(key)):
                raise ClientError('Session model differs from capture. Capture a prompt from this session first.')
    body.setdefault('ext', {})['general_task_param'] = dumps(task)
    body['user_context'] = []
    return body


def sse_events(lines):
    event, data = '', []
    for raw in lines:
        line = raw.decode('utf-8').rstrip('\r\n')
        if not line:
            if data:
                try:
                    yield event, json.loads('\n'.join(data))
                except ValueError:
                    raise ClientError('Invalid JSON in completion stream.') from None
            event, data = '', []
        elif line.startswith('event:'):
            event = line[6:].lstrip()
        elif line.startswith('data:'):
            data.append(line[5:].lstrip())
    if data:
        raise ClientError('Truncated SSE event.')


class StreamState:
    def __init__(self, session=None):
        self.session = session
        self.blocks = {}
        self.finished = False
        self.last_text = ''

    def apply(self, event, data):
        self.last_text = ''
        if event == 'SSE_ACK':
            self.session = data.get('ack_client_meta', {}).get('conversation_id', self.session)
        elif event == 'STREAM_ERROR':
            raise ClientError(f'Completion STREAM_ERROR; session={self.session}. Check session before retrying.')
        elif event == 'SSE_REPLY_END' and data.get('end_type') == 3:
            self.finished = True
        elif event == 'FULL_MSG_NOTIFY' and data.get('message', {}).get('user_type') == 2:
            message = data['message']
            for block in message.get('content_block', []):
                value = block.get('content', {}).get('text_block', {}).get('text')
                if block.get('block_type') == 10000 and not block.get('parent_id') and value is not None:
                    self.blocks[(str(message.get('message_id', '')), block['block_id'])] = value
        elif event == 'STREAM_CHUNK':
            for op in data.get('patch_op', []):
                for block in op.get('patch_value', {}).get('content_block', []):
                    if block.get('parent_id') or block.get('block_type') != 10000:
                        continue
                    value = block.get('content', {}).get('text_block', {}).get('text')
                    if value is None:
                        continue
                    key = (str(data.get('message_id', '')), block['block_id'])
                    if block.get('patch_type', op.get('patch_type')) == 2:
                        self.blocks[key] = value
                    else:
                        self.blocks[key] = self.blocks.get(key, '') + value
                        self.last_text += value

    def text(self):
        return '\n'.join(self.blocks.values())


def session_id(value):
    if not value.isdecimal():
        raise argparse.ArgumentTypeError('session ID must be a decimal string')
    return value


def positive(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError('must be positive')
    return number


def parser():
    p = argparse.ArgumentParser(prog='doubao-work', description=__doc__)
    p.add_argument('--profile', default=str(DEFAULT_PROFILE))
    p.add_argument('--timeout', type=positive, default=180)
    p.add_argument('--output-format', choices=['json', 'text', 'stream-json'], default='json')
    p.add_argument('-p', '--prompt', help='Create a session, or continue --session, and exit')
    p.add_argument('--session', type=session_id)
    sub = p.add_subparsers(dest='command')
    auth = sub.add_parser('auth', help='Capture login/runtime from Bifrost; no interactive login')
    auth.add_argument('action', choices=['capture', 'status'])
    auth.add_argument('--request-id')
    auth.add_argument('--completion-id')
    sessions = sub.add_parser('sessions', aliases=['session'])
    actions = sessions.add_subparsers(dest='action', required=True)
    listing = actions.add_parser('list')
    listing.add_argument('--limit', type=positive, default=20)
    listing.add_argument('--cursor', type=session_id, default='0')
    listing.add_argument('--pin-query-type', type=int, choices=[0, 1])
    listing.add_argument('--all', action='store_true')
    listing.add_argument('--search')
    get = actions.add_parser('get')
    get.add_argument('id', type=session_id)
    messages = actions.add_parser('messages')
    messages.add_argument('id', type=session_id)
    messages.add_argument('--limit', type=positive, default=20)
    messages.add_argument('--anchor', type=session_id, default='0')
    messages.add_argument('--all', action='store_true')
    messages.add_argument('--direction', type=int, choices=[1, 2], default=2)
    create = actions.add_parser('create')
    create.add_argument('-p', '--prompt', dest='action_prompt', required=True)
    create.add_argument('--title')
    send = actions.add_parser('send')
    send.add_argument('id', type=session_id)
    send.add_argument('-p', '--prompt', dest='action_prompt', required=True)
    rename = actions.add_parser('rename')
    rename.add_argument('id', type=session_id)
    rename.add_argument('title')
    delete = actions.add_parser('delete')
    delete.add_argument('id', type=session_id)
    delete.add_argument('--yes', action='store_true', required=True,
                        help='Explicitly delete this single session without a prompt')
    return p


def run(args):
    if args.command == 'auth' and args.action == 'capture':
        return capture_profile(args.profile, args.request_id, args.completion_id)
    try:
        with Path(args.profile).expanduser().open() as source:
            profile = json.load(source)
    except (OSError, ValueError):
        raise ClientError('No valid profile. Run: doubao-work auth capture') from None
    if profile.get('schema_version') != 1 or not profile.get('headers', {}).get('cookie'):
        raise ClientError('Invalid profile; run auth capture again.')
    client = Client(profile, args.timeout)
    if args.command == 'auth':
        client.list_page(1)
        return {'ok': True, 'authenticated': True, 'captured_at': profile.get('captured_at')}
    if args.prompt is not None:
        return client.send(args.prompt, args.session, args.output_format == 'stream-json')
    if args.command not in ('session', 'sessions'):
        raise ClientError('Choose a sessions command or supply -p PROMPT.')
    if args.action == 'list':
        return client.sessions(args.limit, args.cursor, args.all, args.search, args.pin_query_type)
    if args.action == 'get':
        return client.info(args.id)
    if args.action == 'messages':
        return client.history(args.id, args.limit, args.anchor, args.direction, args.all)
    if args.action == 'rename':
        if not args.title.strip():
            raise ClientError('Title must not be empty.')
        return client.rename(args.id, args.title)
    if args.action == 'delete':
        return client.delete(args.id)
    result = client.send(args.action_prompt, getattr(args, 'id', None), args.output_format == 'stream-json')
    if args.action == 'create' and args.title:
        try:
            client.rename(result['session_id'], args.title)
        except ClientError as e:
            raise ClientError(f"Created session={result['session_id']}, but rename failed: {e}") from None
        result['name'] = args.title
    return result


def main(argv=None):
    p = parser()
    args = p.parse_args(argv)
    if args.session and args.prompt is None:
        p.error('--session requires -p')
    if not args.command and args.prompt is None:
        p.print_help()
        return 0
    if args.command and args.prompt is not None:
        p.error('Use either root -p or a subcommand.')
    try:
        result = run(args)
        if args.output_format == 'text' and isinstance(result, dict) and 'text' in result:
            print(result['text'])
            print('session_id=' + result['session_id'], file=sys.stderr)
        else:
            emit({'type': 'result', **result} if args.output_format == 'stream-json' else result)
        return 0
    except (ClientError, KeyboardInterrupt) as e:
        print(dumps({'ok': False, 'error': str(e) or 'Interrupted; check session before retrying.'}), file=sys.stderr)
        return 1
    except (KeyError, TypeError, ValueError):
        print(dumps({'ok': False, 'error': 'Unsupported profile or API response shape; refresh capture and check client version.'}),
              file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
