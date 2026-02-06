import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, DB_PROVIDER, users, sessions, accounts, verification } from '@/db/client';

let cachedAuth: ReturnType<typeof betterAuth> | null = null;

function resolveBaseURL(): string {
  return (
    process.env.BETTER_AUTH_BASE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  );
}

function requireSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Missing BETTER_AUTH_SECRET. Set it in .env.local (see .env.example) before running the app.'
    );
  }
  return secret;
}

function resolveSocialProviders(): Record<string, { clientId: string; clientSecret: string }> {
  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }
  return socialProviders;
}

export function getAuth() {
  if (cachedAuth) return cachedAuth;

  const baseURL = resolveBaseURL();
  const secret = requireSecret();
  const socialProviders = resolveSocialProviders();

  cachedAuth = betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: DB_PROVIDER === 'postgres' ? 'pg' : 'sqlite',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Enable in production
    },
    ...(Object.keys(socialProviders).length ? { socialProviders } : {}),
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [baseURL],
  });

  return cachedAuth;
}

export type Session = ReturnType<typeof getAuth>['$Infer']['Session'];
