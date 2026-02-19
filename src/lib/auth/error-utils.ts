export type AuthClientErrorLike =
  | {
      message?: unknown;
      code?: unknown;
      status?: unknown;
    }
  | null
  | undefined;

// Supabase Auth (and some validation layers) may return compact messages like:
// "[body.email] Invalid email address; [body.password] Too small: expected string to have >=1 characters"
// We parse those into per-field strings so the UI can show field-level feedback without exposing raw internals.
export function parseBodyFieldErrors(message: unknown): Record<string, string> {
  if (typeof message !== 'string' || !message) return {};

  const errors: Record<string, string> = {};
  const re = /\[body\.([a-zA-Z0-9_]+)\]\s*([^;]+)(?:;|$)/g;
  for (const match of message.matchAll(re)) {
    const field = match[1];
    const text = match[2]?.trim();
    if (!field || !text) continue;
    if (!errors[field]) errors[field] = text;
  }
  return errors;
}

export function coerceErrorMessage(error: AuthClientErrorLike): string | null {
  if (!error) return null;
  const msg = (error as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return null;
}

export function coerceErrorCode(error: AuthClientErrorLike): string | null {
  if (!error) return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && code.trim()) return code.trim();
  return null;
}
