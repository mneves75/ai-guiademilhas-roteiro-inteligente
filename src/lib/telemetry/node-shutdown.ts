type ShutdownFn = () => Promise<void>;

let registered = false;

export function registerProcessShutdownHook(shutdown: ShutdownFn): void {
  if (registered) return;
  registered = true;

  // Best-effort flush on shutdown. Do not block termination.
  process.once('SIGTERM', () => {
    void shutdown().catch(() => undefined);
  });
  process.once('SIGINT', () => {
    void shutdown().catch(() => undefined);
  });
}
