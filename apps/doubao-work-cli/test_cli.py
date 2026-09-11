import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import cli


def profile():
    return {'completion_template': {
        'client_meta': {'bot_id': 'test-bot'}, 'messages': [{'old': 'prompt'}],
        'option': {'conversation_init_ext': {'mode_id': '3'},
                   'general_task_param': {'thread_local_message_id': ['old'],
                                          'agent_task_param': {'workspace': '/test',
                                                               'local_device_id': '1', 'runtime_type': 2}}},
        'ext': {}, 'user_context': ['old attachment']}}


class PayloadTests(unittest.TestCase):
    def test_new_prompt_never_reuses_ids_or_captured_text(self):
        original = profile()
        before = copy.deepcopy(original)
        first = cli.completion_body(original, 'hello')
        second = cli.completion_body(original, 'hello')
        self.assertEqual(original, before)
        self.assertNotEqual(first['messages'][0]['local_message_id'], second['messages'][0]['local_message_id'])
        self.assertNotEqual(first['option']['unique_key'], second['option']['unique_key'])
        self.assertEqual(first['client_meta']['conversation_id'], '')
        self.assertTrue(first['option']['need_create_conversation'])
        self.assertEqual(first['user_context'], [])
        task = first['option']['general_task_param']
        self.assertEqual(task['thread_local_message_id'], [first['messages'][0]['local_message_id']])
        self.assertEqual(json.loads(first['ext']['general_task_param']), task)
        self.assertNotIn('old', json.dumps(first))

    def test_continue_preserves_large_id_and_integer_cursor(self):
        result = cli.completion_body(profile(), 'continue', {
            'conversation_id': '38441140597324034', 'last_section_id': '38441140597324035',
            'msg_cursor': '9007199254740993', 'status': 1})
        self.assertEqual(result['client_meta']['conversation_id'], '38441140597324034')
        self.assertEqual(result['client_meta']['last_message_index'], 9007199254740993)
        self.assertFalse(result['option']['need_create_conversation'])

    def test_different_runtime_and_deleted_session_rejected(self):
        for info in [
            {'status': 2},
            {'status': 1, 'extra': json.dumps({'agent_task_param': json.dumps({'workspace': '/other'})})},
        ]:
            with self.assertRaises(cli.ClientError):
                cli.completion_body(profile(), 'hello', {'conversation_id': '123', **info})

    def test_empty_prompt(self):
        with self.assertRaises(cli.ClientError):
            cli.completion_body(profile(), '  ')

    def test_private_file_atomic_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'profile.json'
            cli.save_private(p, {'secret': 'test-only'})
            self.assertEqual(p.stat().st_mode & 0o777, 0o600)
            cli.save_private(p, {'secret': 'rotated'})
            self.assertEqual(json.loads(p.read_text()), {'secret': 'rotated'})
            self.assertEqual(len(list(Path(directory).iterdir())), 1)


class StreamTests(unittest.TestCase):
    def test_utf8_crlf_and_multiline_sse(self):
        stream = io.BytesIO('event: TEST\r\ndata: {\r\ndata: "text":"你好"}\r\n\r\n'.encode())
        self.assertEqual(list(cli.sse_events(stream)), [('TEST', {'text': '你好'})])

    def test_truncated_or_invalid_sse_fails(self):
        for source in [b'event: TEST\ndata: {}\n', b'data: not-json\n\n']:
            with self.assertRaises(cli.ClientError):
                list(cli.sse_events(io.BytesIO(source)))

    def chunk(self, text, parent='', patch_type=1):
        return {'message_id': '123', 'patch_op': [{'patch_object': 1, 'patch_value': {
            'content_block': [{'block_type': 10000, 'block_id': 'block', 'parent_id': parent,
                               'patch_type': patch_type, 'content': {'text_block': {'text': text}}}]}}]}

    def test_deltas_no_reasoning_and_terminal_end(self):
        state = cli.StreamState()
        state.apply('SSE_ACK', {'ack_client_meta': {'conversation_id': '9007199254740993'}})
        state.apply('STREAM_CHUNK', self.chunk('private reasoning', 'thinking-parent'))
        state.apply('CHUNK_DELTA', {'text': 'also reasoning'})
        state.apply('STREAM_CHUNK', self.chunk('CLI_'))
        state.apply('STREAM_CHUNK', self.chunk('OK'))
        self.assertEqual(state.text(), 'CLI_OK')
        state.apply('SSE_REPLY_END', {'end_type': 1})
        self.assertFalse(state.finished)
        state.apply('SSE_REPLY_END', {'end_type': 3})
        self.assertTrue(state.finished)
        self.assertEqual(state.session, '9007199254740993')

    def test_snapshot_replaces_not_duplicates(self):
        state = cli.StreamState('1')
        state.apply('STREAM_CHUNK', self.chunk('part'))
        state.apply('STREAM_CHUNK', self.chunk('complete', patch_type=2))
        self.assertEqual(state.text(), 'complete')
        with self.assertRaises(cli.ClientError):
            state.apply('STREAM_ERROR', {'code': 123})


class APITests(unittest.TestCase):
    def test_business_error_even_on_http_success(self):
        for payload in [{'status_code': 123}, {}, []]:
            with self.assertRaises(cli.ClientError):
                cli.check_response(payload)

    def test_cursor_is_integer_without_precision_loss(self):
        client = cli.Client({})
        with patch.object(client, 'im', return_value={}) as method:
            client.list_page(cursor='9007199254740993')
            self.assertEqual(method.call_args.args[3]['conv_version'], 9007199254740993)
            self.assertEqual(method.call_args.args[3]['direction'], 1)
            self.assertEqual(method.call_args.args[3]['option']['pc_pin_query_type'], 1)

    def test_pin_group_transition_can_keep_same_cursor(self):
        client = cli.Client({})
        with patch.object(client, 'list_page', side_effect=[
            {'cells': [], 'has_more': True, 'next_conv_version': '0', 'extra': {'pc_pin_query_type': 1}},
            {'cells': [], 'has_more': False, 'next_conv_version': '0', 'extra': {'pc_pin_query_type': 1}},
        ]) as method:
            self.assertFalse(client.sessions(all_pages=True)['has_more'])
            self.assertEqual(method.call_args_list[0].args[2], 0)
            self.assertEqual(method.call_args_list[1].args[2], 1)

    def test_message_history_stops_even_with_next_index(self):
        client = cli.Client({})
        with patch.object(client, 'messages', return_value={
            'messages': [], 'has_more': False, 'next_index': '42',
        }) as method:
            self.assertFalse(client.history('123', all_pages=True)['has_more'])
            self.assertEqual(method.call_count, 1)

    def test_pagination_dedupe_and_stop_on_has_more_false(self):
        client = cli.Client({})
        def cell(sid):
            return {'conversation': {'conversation_id': sid, 'name': 'test'}}
        with patch.object(client, 'list_page', side_effect=[
            {'cells': [cell('1')], 'has_more': True, 'next_conv_version': '2'},
            {'cells': [cell('1'), cell('2')], 'has_more': False, 'next_conv_version': '3'},
        ]) as method:
            data = client.sessions(all_pages=True)
            self.assertEqual(len(data['sessions']), 2)
            self.assertEqual(method.call_count, 2)
            self.assertFalse(data['has_more'])

    def test_repeated_cursor_fails(self):
        client = cli.Client({})
        with patch.object(client, 'list_page', return_value={'has_more': True, 'next_conv_version': '0'}):
            with self.assertRaises(cli.ClientError):
                client.sessions(all_pages=True)

    def test_delete_only_one_session_and_verify(self):
        client = cli.Client({})
        with patch.object(client, 'im', return_value={}) as method, \
             patch.object(client, 'info', return_value={'status': 2}):
            self.assertTrue(client.delete('123')['deleted'])
            value = method.call_args.args[3]
            self.assertEqual(value['conversation_id'], ['123'])
            self.assertFalse(value['delete_all'])


if __name__ == '__main__':
    unittest.main()
