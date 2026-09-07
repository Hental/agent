export interface CloseableServer {
  close(callback: (error?: Error) => void): unknown;
}

interface LarkFailureHandlerOptions {
  logError?: (message: string, error: unknown) => void;
  setExitCode?: (code: number) => void;
}

export function createLarkFailureHandler(
  getServer: () => CloseableServer | undefined,
  options: LarkFailureHandlerOptions = {},
): (error: unknown) => void {
  const logError = options.logError ?? ((message, error) => console.error(message, error));
  const setExitCode = options.setExitCode ?? ((code) => {
    process.exitCode = code;
  });
  let handled = false;

  return (error) => {
    if (handled) return;
    handled = true;
    logError('飞书 Bot 初始化失败，正在停止 Hono 服务：', error);

    const server = getServer();
    if (!server) {
      setExitCode(1);
      return;
    }

    server.close((closeError) => {
      if (closeError && (closeError as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
        logError('Hono 服务关闭失败：', closeError);
      }
      setExitCode(1);
    });
  };
}
