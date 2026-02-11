export function getHealthPayload() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
  };
}
