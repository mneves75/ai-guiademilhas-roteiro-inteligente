import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, DB_PROVIDER, users, sessions, accounts, verification } from '@/db/client';

const baseURL =
  process.env.BETTER_AUTH_BASE_URL ??
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000';

// Fail fast with a single actionable error instead of letting Better Auth spam logs
// during `next build` (which can execute route modules multiple times).
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error(
    'Missing BETTER_AUTH_SECRET. Set it in .env.local (see .env.example) before running the app or `pnpm build`.'
  );
}

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

export const auth = betterAuth({
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

export type Session = typeof auth.$Infer.Session;
