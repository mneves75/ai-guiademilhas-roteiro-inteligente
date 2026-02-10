import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { magicLink } from 'better-auth/plugins/magic-link';
import { eq } from 'drizzle-orm';
import { db, DB_PROVIDER, users, sessions, accounts, verification } from '@/db/client';
import { sendMagicLinkEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email-actions';
import { assertProductionConfig } from '@/lib/security/prod-config';

function isLoopbackOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  } catch {
    return false;
  }
}

function initAuth() {
  // Fail fast for production misconfiguration (defense-in-depth).
  assertProductionConfig();

  const baseURL = resolveBaseURL();
  const secret = requireSecret();
  const socialProviders = resolveSocialProviders();
  const adminEmails = getAdminEmailAllowlist();
  // Test-only escape hatch: Playwright runs against a production build (`pnpm build && pnpm start`)
  // and the full cross-browser matrix can exceed Better Auth's default rate limits.
  // Keep this locked to local loopback origins to avoid accidental weakening in real deployments.
  const isPlaywrightE2E = process.env.PLAYWRIGHT_E2E === '1' && isLoopbackOrigin(baseURL);

  return betterAuth({
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
      requireEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name || user.email,
          resetUrl: url,
          expiresInMinutes: 60,
        });
      },
    },
    ...(Object.keys(socialProviders).length ? { socialProviders } : {}),
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [baseURL],
    ...(isPlaywrightE2E ? { rateLimit: { enabled: false } } : {}),
    plugins: [
      admin({
        defaultRole: 'user',
        adminRoles: ['admin'],
        allowImpersonatingAdmins: false,
        impersonationSessionDuration: 60 * 60, // 1 hour
      }),
      magicLink({
        expiresIn: 60 * 5, // 5 minutes
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail({ to: email, url, expiresInMinutes: 5 });
        },
      }),
    ],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Best-effort: do not block signup/login flows on email delivery.
            await sendWelcomeEmail({
              to: user.email,
              name: user.name || user.email,
            }).catch(() => {});

            // Bootstrap admin role based on env allowlist.
            if (adminEmails.has(user.email.toLowerCase())) {
              await db
                .update(users)
                .set({ role: 'admin', updatedAt: new Date() })
                .where(eq(users.id, user.id));
            }
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            // Ensure allowlisted admins are upgraded even if they existed before roles were added.
            const user = await db.query.users.findFirst({
              where: (u, { eq }) => eq(u.id, session.userId),
            });
            if (!user) return;
            if (!adminEmails.has(user.email.toLowerCase())) return;
            if (user.role === 'admin') return;
            await db
              .update(users)
              .set({ role: 'admin', updatedAt: new Date() })
              .where(eq(users.id, user.id));
          },
        },
      },
    },
  });
}

type AuthInstance = ReturnType<typeof initAuth>;

let cachedAuth: AuthInstance | null = null;

function resolveBaseURL(): string {
  const fromEnv =
    process.env.BETTER_AUTH_BASE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      throw new Error(
        'Invalid BETTER_AUTH_BASE_URL / BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL value.'
      );
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing BETTER_AUTH_BASE_URL (or BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL). ' +
        'Refusing to guess base URL in production.'
    );
  }

  return 'http://localhost:3000';
}

function requireSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Missing BETTER_AUTH_SECRET. Set it in .env.local (see .env.example) before running the app.'
    );
  }
  if (secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET is too short. Use a 32+ character random value (see .env.example).'
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

function getAdminEmailAllowlist(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getAuth() {
  if (!cachedAuth) cachedAuth = initAuth();
  return cachedAuth;
}

export type Session = AuthInstance['$Infer']['Session'];
