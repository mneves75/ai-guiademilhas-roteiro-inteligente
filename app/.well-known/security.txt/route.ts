import { NextRequest, NextResponse } from 'next/server';
import { resolveAppOrigin } from '@/lib/security/origin';
import { isLocalOrigin } from '@/lib/security/local-origin';

// RFC 9116: https://www.rfc-editor.org/rfc/rfc9116
function buildContact(origin: string) {
  const email = process.env.SECURITY_CONTACT_EMAIL?.trim();
  const url = process.env.SECURITY_CONTACT_URL?.trim();

  if (email) return `mailto:${email}`;
  if (url) return url;

  // In production, force explicit configuration so we never publish a bogus contact channel.
  if (process.env.NODE_ENV === 'production' && !isLocalOrigin(origin)) {
    throw new Error(
      'Missing SECURITY_CONTACT_EMAIL (or SECURITY_CONTACT_URL). ' +
        'Refusing to publish /.well-known/security.txt without a real contact.'
    );
  }

  // Best-effort default: follow common convention (RFC 2142) without shipping placeholders.
  // In production you should still set SECURITY_CONTACT_EMAIL explicitly.
  try {
    const u = new URL(origin);
    const host = u.hostname;
    const isLocal =
      host === 'localhost' || host === '0.0.0.0' || host === '127.0.0.1' || /^[0-9.]+$/.test(host);
    if (!isLocal && host) return `mailto:security@${host}`;
  } catch {
    // ignore
  }

  return 'mailto:security@invalid.local';
}

export function GET(request: NextRequest) {
  const origin = resolveAppOrigin(request);

  // RFC 9116 requires https:// for web URIs. Enforce this in production for public origins.
  if (
    process.env.NODE_ENV === 'production' &&
    !isLocalOrigin(origin) &&
    !origin.startsWith('https://')
  ) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL must be an https:// origin in production to publish /.well-known/security.txt.'
    );
  }

  const policyUrl = process.env.SECURITY_POLICY_URL?.trim() ?? `${origin}/security`;
  const acknowledgmentsUrl = process.env.SECURITY_ACK_URL?.trim() ?? `${policyUrl}#acknowledgments`;
  const encryptionUrl = process.env.SECURITY_ENCRYPTION_URL?.trim();

  // RFC 9116 uses an ISO 8601/RFC 3339 timestamp (e.g. 2025-12-31T23:59:59.000Z).
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const canonicalUrl = `${origin}/.well-known/security.txt`;

  const body = [
    `Contact: ${buildContact(origin)}`,
    `Expires: ${expires}`,
    `Preferred-Languages: pt-BR, en`,
    `Canonical: ${canonicalUrl}`,
    `Policy: ${policyUrl}`,
    `Acknowledgments: ${acknowledgmentsUrl}`,
    ...(encryptionUrl ? [`Encryption: ${encryptionUrl}`] : []),
    '',
  ].join('\n');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Reduce load but keep it reasonably fresh. Clients should obey Expires.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
