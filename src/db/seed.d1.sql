-- Cloudflare D1 seed (SQLite)
--
-- This file is designed to be safe to re-run.
-- Apply with Wrangler (local or remote):
--   wrangler d1 execute app-db --local  --file=src/db/seed.d1.sql
--   wrangler d1 execute app-db --remote --file=src/db/seed.d1.sql

-- Milliseconds since epoch (Drizzle `integer({ mode: "timestamp" })` convention).
-- Recompute per statement to keep this file simple/portable.

-- ---------------------------------------------------------------------------
-- Users (10)
-- ---------------------------------------------------------------------------
WITH now(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000)
INSERT OR IGNORE INTO users (id, name, email, email_verified, image, created_at, updated_at)
SELECT 'user_01', 'User 1', 'user1@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_02', 'User 2', 'user2@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_03', 'User 3', 'user3@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_04', 'User 4', 'user4@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_05', 'User 5', 'user5@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_06', 'User 6', 'user6@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_07', 'User 7', 'user7@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_08', 'User 8', 'user8@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_09', 'User 9', 'user9@example.com', 1, NULL, now.ms, now.ms FROM now
UNION ALL
SELECT 'user_10', 'User 10', 'user10@example.com', 1, NULL, now.ms, now.ms FROM now;

-- ---------------------------------------------------------------------------
-- Workspaces (5)
-- ---------------------------------------------------------------------------
WITH now(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000)
INSERT OR IGNORE INTO workspaces (name, slug, owner_user_id, created_at, updated_at, deleted_at)
VALUES
  ('Acme Corp', 'acme-corp', 'user_01', (SELECT ms FROM now), (SELECT ms FROM now), NULL),
  ('TechStart Inc', 'techstart-inc', 'user_02', (SELECT ms FROM now), (SELECT ms FROM now), NULL),
  ('DevShop', 'devshop', 'user_03', (SELECT ms FROM now), (SELECT ms FROM now), NULL),
  ('StartupXYZ', 'startupxyz', 'user_04', (SELECT ms FROM now), (SELECT ms FROM now), NULL),
  ('CloudNine', 'cloudnine', 'user_05', (SELECT ms FROM now), (SELECT ms FROM now), NULL);

-- ---------------------------------------------------------------------------
-- Workspace members (15)
-- ---------------------------------------------------------------------------
WITH now(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000)
INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, created_at, updated_at, deleted_at)
SELECT w.id, w.owner_user_id, 'owner', now.ms, now.ms, NULL
FROM workspaces w, now
WHERE w.slug IN ('acme-corp', 'techstart-inc', 'devshop', 'startupxyz', 'cloudnine');

WITH now(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000)
INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, created_at, updated_at, deleted_at)
SELECT w.id, 'user_06', 'member', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'acme-corp'
UNION ALL
SELECT w.id, 'user_07', 'member', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'techstart-inc'
UNION ALL
SELECT w.id, 'user_08', 'member', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'devshop'
UNION ALL
SELECT w.id, 'user_09', 'member', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'startupxyz'
UNION ALL
SELECT w.id, 'user_10', 'member', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'cloudnine';

WITH now(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000)
INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, created_at, updated_at, deleted_at)
SELECT w.id, 'user_07', 'viewer', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'acme-corp'
UNION ALL
SELECT w.id, 'user_08', 'viewer', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'techstart-inc'
UNION ALL
SELECT w.id, 'user_09', 'viewer', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'devshop'
UNION ALL
SELECT w.id, 'user_10', 'viewer', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'startupxyz'
UNION ALL
SELECT w.id, 'user_06', 'viewer', now.ms, now.ms, NULL FROM workspaces w, now WHERE w.slug = 'cloudnine';

-- ---------------------------------------------------------------------------
-- Subscriptions (5)
-- ---------------------------------------------------------------------------
-- 30 days in ms: 30 * 24 * 60 * 60 * 1000 = 2592000000
WITH now(ms) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER) * 1000)
INSERT OR IGNORE INTO subscriptions (
  workspace_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  w.id,
  'cus_sample_' || w.id,
  'sub_sample_' || w.id,
  'price_basic',
  'active',
  now.ms,
  now.ms + 2592000000,
  0,
  now.ms,
  now.ms,
  NULL
FROM workspaces w, now
WHERE w.slug = 'acme-corp'
UNION ALL
SELECT
  w.id,
  'cus_sample_' || w.id,
  'sub_sample_' || w.id,
  'price_pro',
  'active',
  now.ms,
  now.ms + 2592000000,
  0,
  now.ms,
  now.ms,
  NULL
FROM workspaces w, now
WHERE w.slug = 'techstart-inc'
UNION ALL
SELECT
  w.id,
  'cus_sample_' || w.id,
  'sub_sample_' || w.id,
  'price_enterprise',
  'active',
  now.ms,
  now.ms + 2592000000,
  0,
  now.ms,
  now.ms,
  NULL
FROM workspaces w, now
WHERE w.slug = 'devshop'
UNION ALL
SELECT
  w.id,
  'cus_sample_' || w.id,
  'sub_sample_' || w.id,
  'price_basic',
  'canceled',
  now.ms,
  now.ms + 2592000000,
  0,
  now.ms,
  now.ms,
  NULL
FROM workspaces w, now
WHERE w.slug = 'startupxyz'
UNION ALL
SELECT
  w.id,
  'cus_sample_' || w.id,
  'sub_sample_' || w.id,
  'price_pro',
  'active',
  now.ms,
  now.ms + 2592000000,
  0,
  now.ms,
  now.ms,
  NULL
FROM workspaces w, now
WHERE w.slug = 'cloudnine';

