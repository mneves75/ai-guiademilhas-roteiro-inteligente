import 'server-only';
import { db, planCache } from '@/db/client';
import { eq, and, gt } from 'drizzle-orm';
import type { TravelPreferences, PlannerReport } from './types';

/**
 * Create a deterministic SHA256 hash from travel preferences.
 *
 * Normalize the object to ensure deterministic hashing:
 * - Sort keys alphabetically
 * - Trim all string values and lowercase them
 * - Convert numbers to strings consistently
 *
 * Uses Web Crypto API (crypto.subtle) which works in both Node and Edge.
 */
export async function hashPreferences(preferences: TravelPreferences): Promise<string> {
  const normalized = Object.keys(preferences)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = preferences[key as keyof TravelPreferences];
      acc[key] = typeof value === 'string' ? value.trim().toLowerCase() : value;
      return acc;
    }, {});

  const data = new TextEncoder().encode(JSON.stringify(normalized));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Look up a cached report by preferences hash.
 * Returns null on miss or if expired.
 */
export async function getCachedReport(hash: string): Promise<PlannerReport | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);

  const rows = await db
    .select()
    .from(planCache)
    .where(and(eq(planCache.hash, hash), gt(planCache.createdAt, cutoff)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Increment hit count (best-effort, don't block)
  db.update(planCache)
    .set({ hitCount: row.hitCount + 1 })
    .where(eq(planCache.id, row.id))
    .catch(() => {});

  try {
    return JSON.parse(row.report) as PlannerReport;
  } catch {
    return null;
  }
}

/**
 * Save a report to the cache.
 */
export async function setCachedReport(
  hash: string,
  report: PlannerReport,
  model: string
): Promise<void> {
  await db
    .insert(planCache)
    .values({
      hash,
      report: JSON.stringify(report),
      model,
      hitCount: 0,
    })
    .onConflictDoUpdate({
      target: planCache.hash,
      set: {
        report: JSON.stringify(report),
        model,
        hitCount: 0,
        createdAt: new Date(),
      },
    });
}
