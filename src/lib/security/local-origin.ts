function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '0.0.0.0' || host === '127.0.0.1') return true;
  if (host.endsWith('.local')) return true;

  // Best-effort private IPv4 detection.
  if (/^[0-9.]+$/.test(host)) {
    const parts = host.split('.').map((p) => Number(p));
    if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      const a = parts[0];
      const b = parts[1];
      if (a === undefined || b === undefined) return false;
      if (a === 10) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
    }
  }

  return false;
}

export function isLocalOrigin(origin: string): boolean {
  try {
    return isLocalHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}
