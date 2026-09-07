import { describe, expect, it } from '@rstest/core';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads secrets and keeps fixed behavior out of env control', () => {
    const config = loadConfig({
      LARK_BOT_ID: 'cli_test',
      LARK_BOT_SK: 'secret',
      LARK_AUTO_REPLY: 'false',
      LARK_REPLY_PREFIX: 'ignored',
      LARK_DOMAIN: 'lark',
      LOG_LEVEL: 'debug',
    });
    expect(config).toMatchObject({
      appId: 'cli_test',
      appSecret: 'secret',
      autoReply: true,
      replyPrefix: '收到：',
      domainName: 'feishu',
      logLevel: 'info',
      host: '127.0.0.1',
      port: 3000,
      eventStoreCapacity: 500,
      processConcurrency: 2,
    });
  });

  it('rejects missing credentials and invalid numbers', () => {
    expect(() => loadConfig({})).toThrow('LARK_BOT_ID');
    expect(() => loadConfig({ LARK_BOT_ID: 'id', LARK_BOT_SK: 'sk', PORT: '70000' })).toThrow('PORT');
  });
});
