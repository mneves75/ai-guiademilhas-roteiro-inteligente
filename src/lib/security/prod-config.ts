import { isLocalOrigin } from '@/lib/security/local-origin';

function tryGetOriginFromEnv(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function validateProductionConfig(
  env: NodeJS.ProcessEnv
): { ok: true } | { ok: false; error: string } {
  if (env.NODE_ENV !== 'production') return { ok: true };

  const origin =
    tryGetOriginFromEnv(env.NEXT_PUBLIC_APP_URL) ??
    tryGetOriginFromEnv(env.NEXT_PUBLIC_SUPABASE_URL);

  // If origin is missing, other subsystems will fail fast (e.g. Better Auth baseURL).
  // Keep this validator narrowly scoped to things we can assert safely.
  if (!origin) return { ok: true };

  if (!isLocalOrigin(origin) && !origin.startsWith('https://')) {
    return {
      ok: false,
      error: 'NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SUPABASE_URL) must be https:// in production.',
    };
  }

  const hasSecurityContact =
    !!env.SECURITY_CONTACT_EMAIL?.trim() || !!env.SECURITY_CONTACT_URL?.trim();
  if (!isLocalOrigin(origin) && !hasSecurityContact) {
    return {
      ok: false,
      error:
        'Missing SECURITY_CONTACT_EMAIL (or SECURITY_CONTACT_URL) in production. Required to publish /.well-known/security.txt (RFC 9116).',
    };
  }

  return { ok: true };
}

export function assertProductionConfig(env: NodeJS.ProcessEnv = process.env): void {
  const result = validateProductionConfig(env);
  if (!result.ok) throw new Error(result.error);
}
