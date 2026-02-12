import { db, sharedReports } from '@/db/client';
import { withSoftDeleteFilter } from './base';
import crypto from 'crypto';

function generateShareToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

function fingerprintReport(creatorUserId: string, reportJson: string): string {
  return crypto.createHash('sha256').update(`${creatorUserId}:${reportJson}`).digest('hex');
}

/**
 * Create or return existing shared report (idempotent).
 * Caller is responsible for validating reportJson before calling.
 */
export async function createSharedReport(data: {
  creatorUserId: string;
  locale: string;
  reportJson: string;
}) {
  const fingerprint = fingerprintReport(data.creatorUserId, data.reportJson);

  // Idempotent: scan all user shares to find matching content hash
  const userShares = await db.query.sharedReports.findMany({
    where: (sr, { eq, and }) =>
      and(eq(sr.creatorUserId, data.creatorUserId), withSoftDeleteFilter(sr)),
  });

  const match = userShares.find(
    (sr) => fingerprintReport(data.creatorUserId, sr.reportJson) === fingerprint
  );
  if (match) return match;

  const token = generateShareToken();
  const now = new Date();

  await db.insert(sharedReports).values({
    token,
    creatorUserId: data.creatorUserId,
    locale: data.locale,
    reportJson: data.reportJson,
    createdAt: now,
    updatedAt: now,
  });

  const result = await db.query.sharedReports.findFirst({
    where: (sr, { eq, and }) => and(eq(sr.token, token), withSoftDeleteFilter(sr)),
  });

  return result!;
}

export async function getSharedReportByToken(token: string) {
  return db.query.sharedReports.findFirst({
    where: (sr, { eq, and }) => and(eq(sr.token, token), withSoftDeleteFilter(sr)),
  });
}
