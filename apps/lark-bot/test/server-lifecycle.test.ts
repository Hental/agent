import { describe, expect, it, rs } from '@rstest/core';
import { createLarkFailureHandler, type CloseableServer } from '../src/server-lifecycle.js';

describe('Lark initialization lifecycle', () => {
  it('closes the Hono server and exits with failure when Lark initialization fails', () => {
    const close = rs.fn<CloseableServer['close']>((callback) => {
      callback();
    });
    const setExitCode = rs.fn<(code: number) => void>();
    const logError = rs.fn<(message: string, error: unknown) => void>();
    const handleFailure = createLarkFailureHandler(
      () => ({ close }),
      { setExitCode, logError },
    );

    handleFailure(new Error('invalid app secret'));
    handleFailure(new Error('duplicate failure'));

    expect(close).toHaveBeenCalledTimes(1);
    expect(setExitCode).toHaveBeenCalledWith(1);
    expect(logError).toHaveBeenCalledWith(
      '飞书 Bot 初始化失败，正在停止 Hono 服务：',
      expect.any(Error),
    );
  });
});
