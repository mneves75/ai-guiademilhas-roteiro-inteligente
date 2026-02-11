import 'server-only';

import { createHash } from 'node:crypto';
import { logger } from '@/lib/logger';
import { getOrCreateRequestId } from '@/lib/request-id';
import { captureServerEvent } from '@/lib/analytics/posthog-server';

export type AuditActor = {
  userId?: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
};

export type AuditTarget = {
  type: string;
  id: string | number;
};

export type AuditRecord = {
  action: string;
  actor: AuditActor;
  target?: AuditTarget;
  metadata?: Record<string, unknown>;
};

type RequestLike = {
  headers: Headers;
};

function getClientIp(headers: Headers): string | undefined {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || undefined;
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return undefined;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function auditLog(record: AuditRecord): void {
  logger.info({ audit: true, ...record }, record.action);

  // Best-effort analytics hook (no-op unless PostHog is configured).
  const distinctId = record.actor.userId;
  if (distinctId) {
    captureServerEvent({
      distinctId,
      event: record.action,
      properties: {
        target: record.target,
        ...record.metadata,
      },
    });
  }
}

export function auditFromRequest(request: RequestLike, record: AuditRecord): void {
  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') ?? undefined;

  auditLog({
    ...record,
    actor: {
      requestId: record.actor.requestId ?? getOrCreateRequestId(request),
      // Never log raw PII; hashes are sufficient for dedup/forensics.
      ipHash: record.actor.ipHash ?? (ip ? sha256Hex(`v1:${ip}`) : undefined),
      userAgentHash:
        record.actor.userAgentHash ?? (userAgent ? sha256Hex(`v1:${userAgent}`) : undefined),
      ...record.actor,
    },
  });
}
