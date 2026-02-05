# ROADMAP: NextJS Bootstrapped Shipped

**Project Value:** Auth + protected routes work flawlessly. Everything builds on authenticated users being able to sign up, log in, and access gated content reliably.

**Version:** v1 (Initial Release - Full Featured Demo)
**Depth:** Comprehensive (12 phases, foundation → features → production)
**Coverage:** 90/90 v1 requirements mapped
**Last Updated:** 2025-02-05

---

## Phase Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Foundation & Code Quality | 10 | Planning Complete |
| 2 | Database & Schema | 5 | Pending |
| 3 | Authentication Core | 8 | Pending |
| 4 | Design System & UI | 11 | Pending |
| 5 | Landing & Core Content | 4 | Pending |
| 6 | Teams & Multi-Tenancy | 7 | Pending |
| 7 | Email System | 6 | Pending |
| 8 | User Dashboard | 5 | Pending |
| 9 | Payments & Stripe | 9 | Pending |
| 10 | Admin Dashboard | 7 | Pending |
| 11 | Blog & SEO | 8 | Pending |
| 12 | Testing, QA & Deployment | 10 | Pending |

---

## Phase Details

### Phase 1: Foundation & Code Quality

**Goal:** Establish project scaffolding, code standards, and automated checks that enforce quality throughout development.

**Why First:** Every subsequent phase depends on tooling, linting, and CI/CD working correctly. TypeScript strict mode and pre-commit hooks catch errors early.

**Dependencies:** None (foundational)

**Requirements Mapped:**
- QUAL-01: TypeScript strict mode enabled
- QUAL-02: ESLint configured with Next.js rules
- QUAL-03: Prettier configured for formatting
- QUAL-04: Husky pre-commit hooks installed
- QUAL-05: lint-staged runs on commit
- QUAL-06: No `any` types allowed (eslint rule)
- CICD-01: GitHub Actions workflow for tests
- CICD-02: GitHub Actions workflow for linting
- CICD-03: GitHub Actions workflow for type checking
- CICD-04: Preview deployments on PR

**Success Criteria:**
1. Developer can clone project and run `pnpm install && pnpm dev` without errors
2. Pre-commit hook prevents commits with TypeScript errors or ESLint violations
3. GitHub Actions workflows run automatically on PR and report linting/type issues
4. New code written in phases 2-12 must pass all quality checks before merge

**Plans:** 4 plans in 3 waves

Plans:
- [ ] 01-01-PLAN.md — Configure TypeScript strict mode + ESLint 9 flat config + Prettier (Wave 1)
- [ ] 01-02-PLAN.md — Create GitHub Actions workflows: lint, type-check, test (Wave 1, parallel)
- [ ] 01-03-PLAN.md — Install Husky + lint-staged + enable Vercel GitHub App (Wave 2)
- [ ] 01-04-PLAN.md — End-to-end verification checkpoint (Wave 3)

---

### Phase 2: Database & Schema

**Goal:** Set up PostgreSQL database with Drizzle ORM, migrations, and multi-tenant data isolation patterns that all subsequent features depend on.

**Why Here:** Core data layer must exist before auth, teams, or features can store anything.

**Dependencies:** Phase 1 (TypeScript + tooling)

**Requirements Mapped:**
- DB-01: PostgreSQL database with Drizzle ORM
- DB-02: Database schema with migrations
- DB-03: Seed script for development data
- DB-04: Soft delete pattern (deleted_at timestamp)
- DB-05: Multi-tenant data isolation

**Success Criteria:**
1. Developer can run migrations and seed database with sample data in seconds
2. Schema includes `deleted_at` timestamp on all user-created content (soft deletes)
3. Database queries respect workspace/tenant context (no data leaks across tenants)
4. Drizzle generates type-safe queries that catch column/table errors at compile time

---

### Phase 3: Authentication Core

**Goal:** Implement Better Auth with email/password signup, OAuth, login persistence, and middleware-based protected route enforcement.

**Why Here:** User management is the foundation. Phases 4+ need users to exist. Dashboard/payment features require auth working.

**Dependencies:** Phase 1 (TypeScript), Phase 2 (Database for user storage)

**Requirements Mapped:**
- AUTH-01: User can sign up with email and password
- AUTH-02: User can sign up/login with OAuth (Google, GitHub)
- AUTH-03: User can log in and stay logged in across sessions
- AUTH-04: User can log out from any page
- AUTH-05: User can reset password via email link
- AUTH-06: User can log in via magic link (passwordless)
- AUTH-07: Protected routes redirect unauthenticated users to login
- AUTH-08: Middleware handles auth checks for protected routes

**Success Criteria:**
1. New user can sign up with email/password and log back in without re-entering credentials across browser refresh
2. OAuth login (Google/GitHub) creates user account and logs in on first signup
3. Password reset link expires after 1 hour and only works once
4. Accessing `/dashboard` when logged out redirects to login; accessing `/` when logged in doesn't redirect
5. Middleware auth check runs on every request and blocks unauthenticated access to protected routes

---

### Phase 4: Design System & UI

**Goal:** Implement Geist design tokens, shadcn/ui components, and Atomic Design hierarchy with light/dark mode toggle and responsive layout.

**Why Here:** After auth, users need a polished interface. Landing page + all subsequent features (dashboard, payments) use these components.

**Dependencies:** Phase 1 (TypeScript), Phase 3 (Auth - for user interface)

**Requirements Mapped:**
- UI-01: Geist design system implemented
- UI-02: Token-based styling (colors, spacing, typography)
- UI-03: Atomic Design hierarchy (atoms, molecules, organisms)
- UI-04: shadcn/ui components integrated
- UI-05: Light and dark mode with system preference
- UI-06: Responsive design for mobile/tablet/desktop
- UI-07: Geist font family loaded
- I18N-01: UI supports multiple languages
- I18N-02: Language switcher in UI
- I18N-03: User language preference persisted
- I18N-04: Date/number formatting locale-aware

**Success Criteria:**
1. User can toggle between light/dark mode and preference persists across sessions (respects system preference by default)
2. All components (buttons, forms, modals, cards) match Geist aesthetic and use token-based spacing/colors
3. Layout adapts gracefully from mobile (320px) → tablet (768px) → desktop (1920px)
4. Language switcher changes UI text and persists user preference in database
5. All date/number formatting respects selected locale (e.g., 2025-02-05 in en-US, 05/02/2025 in pt-BR)

---

### Phase 5: Landing & Core Content

**Goal:** Build public-facing landing page with hero, features, pricing preview, and CTA that drives signup traffic.

**Why Here:** After auth + UI system, we can build the marketing site. This is what visitors see first.

**Dependencies:** Phase 1 (TypeScript), Phase 4 (Design System + components)

**Requirements Mapped:**
- CONT-01: Landing page with hero section
- CONT-02: Landing page with features section
- CONT-03: Landing page with pricing preview
- CONT-04: Landing page with CTA and footer

**Success Criteria:**
1. Landing page loads in under 3 seconds and shows hero image, headline, subheading
2. Features section showcases 4-6 core benefits with icons and descriptions
3. Pricing preview shows plan options without requiring login (links to checkout only after auth)
4. CTA buttons ("Sign Up", "Get Started") appear above fold and drive conversion

---

### Phase 6: Teams & Multi-Tenancy

**Goal:** Enable users to create workspaces, invite members with granular role management, and ensure data isolation per workspace.

**Why Here:** After auth + database foundations, teams are the next structural layer. Required before payments (subscribers subscribe per workspace).

**Dependencies:** Phase 2 (Database - multi-tenant isolation), Phase 3 (Auth - for user context), Phase 7 (Email - for invitations)

**Requirements Mapped:**
- TEAM-01: User can create a workspace/team
- TEAM-02: User can switch between workspaces
- TEAM-03: Owner can invite members via email
- TEAM-04: Invited user receives email with invitation link
- TEAM-05: Owner can remove members from workspace
- TEAM-06: Owner can change member roles (owner/member)
- TEAM-07: Data is isolated per workspace (multi-tenant)

**Success Criteria:**
1. User sees "Create Workspace" prompt after signup and can create first workspace in 3 clicks
2. User with 2+ workspaces can switch via dropdown/sidebar and sees workspace-specific data (not mixed)
3. Owner can send invite email to anyone@example.com and invitee sees join link in inbox
4. Invitee accepts link, creates account or logs in, and gains access to owner's workspace
5. Owner can remove member and member immediately loses access (next page load)

---

### Phase 7: Email System

**Goal:** Set up Resend + React Email for transactional emails (welcome, password reset, invitations) with preview mode in development.

**Why Here:** Emails are needed for Phase 6 (invitations), Phase 3 (password reset), Phase 8+ (user-facing notifications).

**Dependencies:** Phase 1 (TypeScript), Phase 3 (Auth), Phase 6 (Teams - invitations)

**Requirements Mapped:**
- EMAIL-01: Welcome email sent on signup
- EMAIL-02: Password reset email with secure link
- EMAIL-03: Team invitation email with join link
- EMAIL-04: Email templates built with React Email
- EMAIL-05: Email preview available in development
- EMAIL-06: Emails sent via Resend

**Success Criteria:**
1. New user receives welcome email within 2 seconds of signup with onboarding CTA
2. Password reset email includes time-limited link (1 hour) and can only be used once
3. Team invitation email includes workspace name, sender name, and one-click accept link
4. Developer can view email preview at `http://localhost:3000/emails/preview` without sending
5. All emails are responsive (mobile-first) and render correctly in Gmail, Outlook, Apple Mail

---

### Phase 8: User Dashboard

**Goal:** Build authenticated user dashboard with profile management, settings, workspace switcher, and activity overview.

**Why Here:** After auth + teams + email, users need a place to manage their account and see workspace activity.

**Dependencies:** Phase 3 (Auth), Phase 4 (Design System), Phase 6 (Teams), Phase 7 (Email - for notification preferences)

**Requirements Mapped:**
- DASH-01: User can view and edit profile (name, avatar)
- DASH-02: User can manage account settings
- DASH-03: User can switch between workspaces
- DASH-04: User can view subscription status
- DASH-05: Dashboard shows relevant metrics/activity

**Success Criteria:**
1. User can upload profile avatar and edit name/email from dashboard; changes persist and display immediately
2. Settings page includes language/theme preferences, notification toggles, and session management
3. Workspace switcher dropdown shows all workspaces user belongs to and switches instantly
4. Subscription status card shows current plan, next billing date, and "manage billing" button (PayPal/card)
5. Activity feed shows last 10 actions (workspace created, member invited, etc.) with timestamps

---

### Phase 9: Payments & Stripe

**Goal:** Integrate Stripe for subscription management, one-time payments, webhooks, and feature gating based on plan tier.

**Why Here:** After teams + user dashboard, business logic is clear. This enables revenue while protecting free tier features.

**Dependencies:** Phase 2 (Database), Phase 3 (Auth), Phase 6 (Teams - workspace-level subscriptions), Phase 8 (User Dashboard - for Billing link)

**Requirements Mapped:**
- PAY-01: User can view pricing page with plan options
- PAY-02: Pricing page auto-generates from configuration
- PAY-03: User can subscribe to a plan (monthly/yearly)
- PAY-04: User can cancel subscription
- PAY-05: User can access Stripe customer portal
- PAY-06: User can make one-time payments
- PAY-07: Webhooks handle subscription events (create, update, cancel)
- PAY-08: Features are gated based on subscription plan
- PAY-09: Webhook processing is async with idempotency

**Success Criteria:**
1. Pricing page shows 3 plans (Free/Pro/Enterprise) with features list and toggle for monthly/yearly
2. User can subscribe to Pro plan and see Stripe checkout in modal; subscription activates immediately after payment
3. Workspace owner can access Stripe portal from billing dashboard and manage payment method without leaving app
4. Free plan users see "Upgrade" button on features exclusive to Pro (e.g., team invitations); Pro users bypass restriction
5. Subscription webhook events (create/renew/cancel) process within 10 seconds and update workspace access correctly

---

### Phase 10: Admin Dashboard

**Goal:** Build admin-only dashboard for user/subscription metrics, user management, impersonation for debugging, and admin role enforcement.

**Why Here:** After payments + teams, admins need visibility into user base and revenue. Impersonation is a critical support tool.

**Dependencies:** Phase 3 (Auth - admin role check), Phase 6 (Teams), Phase 8 (User Dashboard - to impersonate), Phase 9 (Payments - for subscription data)

**Requirements Mapped:**
- ADMIN-01: Admin can view all users
- ADMIN-02: Admin can view user details and activity
- ADMIN-03: Admin can view all subscriptions
- ADMIN-04: Admin can view revenue metrics
- ADMIN-05: Admin can view signup/active user metrics
- ADMIN-06: Admin can impersonate user for debugging
- ADMIN-07: Admin routes protected by role check

**Success Criteria:**
1. Admin can access `/admin` and see user table with columns: email, signup date, workspace count, last active
2. Admin can click user row and see full profile: created workspaces, team memberships, activity log, subscription status
3. Admin dashboard shows metrics: MRR (Monthly Recurring Revenue), churn rate, signup trend (30 days), active users (30 days)
4. Admin can click "Impersonate" on any user and see app as that user (including their data) in isolated session
5. Non-admin trying to access `/admin` sees 403 error; admin role check runs on every admin route access

---

### Phase 11: Blog & SEO

**Goal:** Implement MDX blog system with SEO optimizations (sitemap, robots.txt, JSON-LD, OpenGraph) for content marketing.

**Why Here:** After landing page + content system, blog extends reach. SEO work supports all pages.

**Dependencies:** Phase 4 (Design System - blog layout), Phase 5 (Landing - meta tag patterns)

**Requirements Mapped:**
- CONT-05: Blog system with MDX support
- CONT-06: Blog posts have SEO meta tags
- CONT-07: Blog index page with post listing
- SEO-01: All pages have proper meta tags
- SEO-02: Sitemap generated automatically
- SEO-03: robots.txt configured
- SEO-04: Structured data (JSON-LD) for key pages
- SEO-05: OpenGraph and Twitter cards configured

**Success Criteria:**
1. Developer can create blog post at `content/blog/post-slug.mdx` with frontmatter (title, date, author) and it automatically appears on blog index
2. Blog post page renders MDX as HTML with syntax highlighting for code blocks
3. Each page (landing, blog index, blog post, pricing) includes meta tags: title, description, og:image, twitter:card
4. `/sitemap.xml` includes all pages with lastmod and changefreq; `/robots.txt` includes sitemap location
5. Blog post includes JSON-LD schema (article type) and search engines parse publish date, author, headline from markup

---

### Phase 12: Testing, QA & Deployment

**Goal:** Establish unit/E2E testing framework, quality gates, and production deployment (Vercel + Docker) with documentation.

**Why Last:** All features exist; tests verify they work. Deployment readiness is final step before launch.

**Dependencies:** Phase 1 (CI/CD basics), all prior phases (features to test)

**Requirements Mapped:**
- TEST-01: Vitest configured for unit tests
- TEST-02: Playwright configured for E2E tests
- TEST-03: Example unit tests included
- TEST-04: Example E2E tests included
- TEST-05: Test coverage reporting
- DEPLOY-01: Vercel one-click deploy works
- DEPLOY-02: Environment variables documented
- DEPLOY-03: Docker deployment option
- DEPLOY-04: docker-compose for local development
- DEPLOY-05: Production deployment checklist

**Success Criteria:**
1. Developer can run `pnpm test:unit` and see coverage report; `pnpm test:e2e` opens Playwright dashboard with full app flows
2. Example unit test provided for utility function (e.g., password validation); example E2E test covers signup → login → dashboard
3. CI runs tests on PR and blocks merge if coverage drops below 70% or E2E fails
4. One-click "Deploy to Vercel" button works; cloned project deploys in <5 minutes with env setup guide
5. `docker build` creates production image; `docker-compose up` runs full app locally with Postgres (no external services needed)

---

## Phase Dependencies

```
Phase 1 (Foundation)
  ↓
Phase 2 (Database)
  ↓
Phase 3 (Auth) ← also depends on Phase 1
  ↓
Phase 4 (Design System) ← also depends on Phase 1, Phase 3
  ↓
Phase 5 (Landing) ← also depends on Phase 4
  ↓
Phase 6 (Teams) ← depends on Phase 2, Phase 3
  ↓
Phase 7 (Email) ← depends on Phase 3, Phase 6
  ↓
Phase 8 (User Dashboard) ← depends on Phase 3, Phase 4, Phase 6, Phase 7
  ↓
Phase 9 (Payments) ← depends on Phase 2, Phase 3, Phase 6, Phase 8
  ↓
Phase 10 (Admin) ← depends on Phase 3, Phase 6, Phase 8, Phase 9
  ↓
Phase 11 (Blog/SEO) ← depends on Phase 4, Phase 5
  ↓
Phase 12 (Testing/Deployment) ← depends on Phase 1 + all others
```

**Critical Path:** 1 → 2 → 3 → 4 → 5 (or parallel 6) → 9 → 12
**Parallel Opportunities:** Phases 5 + 6 + 11 can run simultaneously after their dependencies complete.

---

## Coverage Summary

**Total v1 Requirements:** 90
**Mapped to Phases:** 90
**Coverage:** 100% ✓

**Requirements by Phase:**
| Phase | Count |
|-------|-------|
| 1 | 10 |
| 2 | 5 |
| 3 | 8 |
| 4 | 11 |
| 5 | 4 |
| 6 | 7 |
| 7 | 6 |
| 8 | 5 |
| 9 | 9 |
| 10 | 7 |
| 11 | 8 |
| 12 | 10 |
| **Total** | **90** |

---

## Timeline Estimate

Based on comprehensive depth and yolo mode (aggressive parallelization):

| Phases | Duration | Notes |
|--------|----------|-------|
| 1 (Foundation) | 1 week | Sets up all tooling; unblocks others |
| 2 (Database) | 3-4 days | Schema + migrations; runs parallel to Phase 3 |
| 3 (Auth) | 1 week | Better Auth integration; runs after Phase 2 complete |
| 4 (Design) | 1 week | Component library; runs parallel to Phase 3 |
| 5 (Landing) | 3-4 days | Uses Phase 4 components; quick |
| 6 (Teams) | 5-6 days | Complex logic; depends on Phases 2, 3, 7 |
| 7 (Email) | 3-4 days | Resend setup; enables Phase 6 |
| 8 (Dashboard) | 4-5 days | UI patterns from Phase 4; runs after Phases 6, 7 |
| 9 (Payments) | 1 week | Webhooks + feature gating; complex |
| 10 (Admin) | 4-5 days | UI reuse from Phase 8 |
| 11 (Blog) | 4-5 days | Can run parallel to Phases 9, 10 |
| 12 (Testing) | 1 week | Final QA + deployment setup |
| **Total** | ~8 weeks | 4-5 weeks with max parallelization |

---

## Success Criteria Verification

Roadmap is complete when:
- [ ] Phase 1: CI/CD runs on every commit; TypeScript errors block merge
- [ ] Phase 2: Dev can seed database in 10 seconds
- [ ] Phase 3: New user signup → login cycle works end-to-end
- [ ] Phase 4: UI components are polished and responsive; theme toggle works
- [ ] Phase 5: Landing page converts visitors to signup
- [ ] Phase 6: User can create workspace, invite member, verify data isolation
- [ ] Phase 7: Emails send and preview in development mode
- [ ] Phase 8: User dashboard is fully functional
- [ ] Phase 9: Stripe integration processes subscriptions; webhooks trigger correctly
- [ ] Phase 10: Admin can see all users and impersonate
- [ ] Phase 11: Blog posts are indexed and SEO meta tags validate
- [ ] Phase 12: Full test coverage exists; one-click Vercel deploy works

---

**Phase 1 planning complete. Ready for execution via `/gsd:execute-phase 1`.**
