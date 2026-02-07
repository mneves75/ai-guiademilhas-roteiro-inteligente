const DEFAULT_CALLBACK_PATH = '/dashboard';

type NormalizeCallbackUrlOptions = {
  defaultPath?: string;
};

/**
 * Normalize an untrusted callback/return URL into a safe internal path.
 *
 * Rules:
 * - Only allow relative paths that start with a single `/`.
 * - Reject protocol-relative URLs (`//evil.tld`) and backslash variants.
 * - Reject any string containing backslashes (URL parsing may normalize them).
 */
export function normalizeCallbackUrl(
  value: string | null | undefined,
  options: NormalizeCallbackUrlOptions = {}
): string {
  const fallback = options.defaultPath ?? DEFAULT_CALLBACK_PATH;

  if (!value) return fallback;
  if (value.length > 2048) return fallback;
  // Reject control characters outright (e.g. newlines) to avoid weird parsing edge cases.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (value.includes('\\')) return fallback;

  // Disallow absolute/protocol URLs.
  if (
    value.startsWith('http:') ||
    value.startsWith('https:') ||
    value.startsWith('data:') ||
    value.startsWith('javascript:')
  ) {
    return fallback;
  }

  // Only allow internal relative paths.
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback; // protocol-relative
  if (value.startsWith('/\\')) return fallback;

  return value;
}
