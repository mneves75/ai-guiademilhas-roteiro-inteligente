let sdk: import('@opentelemetry/sdk-node').NodeSDK | null = null;
let shutdownHookRegistered = false;

export async function register() {
  // Default to off; turn on explicitly in production.
  if (process.env.OTEL_ENABLED !== '1') return;

  // Next sets NEXT_RUNTIME for edge/server environments.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Without an exporter, starting OTel adds overhead without producing traces.
  const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (!exporterEndpoint) return;

  // Dev/HMR can call instrumentation multiple times.
  if (sdk) return;

  const [{ NodeSDK }, { getNodeAutoInstrumentations }, { OTLPTraceExporter }] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/auto-instrumentations-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
  ]);

  const sdkInstance = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: exporterEndpoint }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk = sdkInstance;
  await sdkInstance.start();

  if (!shutdownHookRegistered) {
    shutdownHookRegistered = true;
    const { registerProcessShutdownHook } = await import('@/lib/telemetry/node-shutdown');
    registerProcessShutdownHook(async () => {
      const current = sdk;
      if (!current) return;
      await current.shutdown();
    });
  }
}
