import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database before importing admin
vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn(),
    query: {
      users: { findMany: vi.fn() },
      workspaces: { findMany: vi.fn() },
    },
  },
}));

// Import after mocking
import { isAdmin } from '../admin';

describe('admin utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAdmin', () => {
    it('should return false when ADMIN_EMAILS is not set', () => {
      delete process.env.ADMIN_EMAILS;
      expect(isAdmin('test@example.com')).toBe(false);
    });

    it('should return false when email is not in admin list', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';
      expect(isAdmin('user@example.com')).toBe(false);
    });

    it('should return true when email is in admin list', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';
      expect(isAdmin('admin@example.com')).toBe(true);
    });

    it('should handle case-insensitive comparison', () => {
      process.env.ADMIN_EMAILS = 'Admin@Example.com';
      expect(isAdmin('admin@example.com')).toBe(true);
      expect(isAdmin('ADMIN@EXAMPLE.COM')).toBe(true);
    });

    it('should handle multiple admin emails', () => {
      process.env.ADMIN_EMAILS = 'admin1@example.com,admin2@example.com,admin3@example.com';
      expect(isAdmin('admin1@example.com')).toBe(true);
      expect(isAdmin('admin2@example.com')).toBe(true);
      expect(isAdmin('admin3@example.com')).toBe(true);
      expect(isAdmin('user@example.com')).toBe(false);
    });

    it('should handle whitespace in admin email list', () => {
      process.env.ADMIN_EMAILS = ' admin1@example.com , admin2@example.com ';
      expect(isAdmin('admin1@example.com')).toBe(true);
      expect(isAdmin('admin2@example.com')).toBe(true);
    });
  });
});
