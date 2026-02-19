import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock setup (vi.hoisted runs before imports)
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
      signInWithOtp: mocks.signInWithOtp,
    },
  }),
}));

// The route files import from next/server which is available in the test env.
// We do NOT need to mock NextResponse -- it works in vitest with jsdom/node.

// ---------------------------------------------------------------------------
// Route handler imports (after mocks are in place)
// ---------------------------------------------------------------------------

import { POST as requestPasswordResetPOST } from '../../../app/api/auth/request-password-reset/route';
import { POST as resetPasswordPOST } from '../../../app/api/auth/reset-password/route';
import { POST as magicLinkPOST } from '../../../app/api/auth/sign-in/magic-link/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(url: string, body: Record<string, unknown>): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/request-password-reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it('returns 200 with { ok: true } for valid email', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/request-password-reset', {
      email: 'user@example.com',
      redirectTo: 'http://localhost:3000/reset-password',
    });

    const res = await requestPasswordResetPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'http://localhost:3000/reset-password',
    });
  });

  it('returns 400 when email is missing', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/request-password-reset', {});

    const res = await requestPasswordResetPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when email is invalid', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/request-password-reset', {
      email: 'not-an-email',
    });

    const res = await requestPasswordResetPOST(req);
    expect(res.status).toBe(400);
  });

  it('always returns 200 even when Supabase returns an error (anti-enumeration)', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' },
    });

    const req = buildRequest('http://localhost:3000/api/auth/request-password-reset', {
      email: 'nonexistent@example.com',
    });

    const res = await requestPasswordResetPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateUser.mockResolvedValue({ error: null });
  });

  it('returns 200 with { ok: true } for valid password with active session', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/reset-password', {
      newPassword: 'securePassword123',
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'securePassword123' });
  });

  it('returns 400 when newPassword is too short (< 8 chars)', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/reset-password', {
      newPassword: 'short',
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/at least 8 characters/i);
  });

  it('returns 400 when newPassword is missing', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/reset-password', {});

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when no session exists (not authenticated)', async () => {
    mocks.updateUser.mockResolvedValue({
      error: { message: 'Auth session missing' },
    });

    const req = buildRequest('http://localhost:3000/api/auth/reset-password', {
      newPassword: 'securePassword123',
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/session/i);
  });

  it('returns 400 for other Supabase errors', async () => {
    mocks.updateUser.mockResolvedValue({
      error: { message: 'Password is too weak' },
    });

    const req = buildRequest('http://localhost:3000/api/auth/reset-password', {
      newPassword: 'weakpass1',
    });

    const res = await resetPasswordPOST(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/sign-in/magic-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signInWithOtp.mockResolvedValue({ error: null });
  });

  it('returns 200 with { ok: true } for valid email', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/sign-in/magic-link', {
      email: 'user@example.com',
    });

    const res = await magicLinkPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: expect.stringContaining('/api/auth/callback') },
    });
  });

  it('returns 400 when email is missing', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/sign-in/magic-link', {});

    const res = await magicLinkPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when email is invalid', async () => {
    const req = buildRequest('http://localhost:3000/api/auth/sign-in/magic-link', {
      email: 'bad-email',
    });

    const res = await magicLinkPOST(req);
    expect(res.status).toBe(400);
  });

  it('always returns 200 even when Supabase returns an error (anti-enumeration)', async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: { message: 'Email not found in system' },
    });

    const req = buildRequest('http://localhost:3000/api/auth/sign-in/magic-link', {
      email: 'nonexistent@example.com',
    });

    const res = await magicLinkPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
