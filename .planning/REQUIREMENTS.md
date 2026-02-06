# Requirements: NextJS Bootstrapped Shipped

**Defined:** 2025-02-05
**Core Value:** Auth + protected routes work flawlessly. Everything builds on authenticated users being able to sign up, log in, and access gated content reliably.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign up/login with OAuth (Google, GitHub)
- [x] **AUTH-03**: User can log in and stay logged in across sessions
- [x] **AUTH-04**: User can log out from any page
- [x] **AUTH-05**: User can reset password via email link
- [x] **AUTH-06**: User can log in via magic link (passwordless)
- [x] **AUTH-07**: Protected routes redirect unauthenticated users to login
- [x] **AUTH-08**: Middleware handles auth checks for protected routes

### Multi-Tenancy & Teams

- [x] **TEAM-01**: User can create a workspace/team
- [x] **TEAM-02**: User can switch between workspaces
- [x] **TEAM-03**: Owner can invite members via email
- [x] **TEAM-04**: Invited user receives email with invitation link
- [x] **TEAM-05**: Owner can remove members from workspace
- [x] **TEAM-06**: Owner can change member roles (owner/member)
- [x] **TEAM-07**: Data is isolated per workspace (multi-tenant)

### Payments (Stripe)

- [x] **PAY-01**: User can view pricing page with plan options
- [x] **PAY-02**: Pricing page auto-generates from configuration
- [x] **PAY-03**: User can subscribe to a plan (monthly/yearly)
- [x] **PAY-04**: User can cancel subscription
- [x] **PAY-05**: User can access Stripe customer portal
- [x] **PAY-06**: User can make one-time payments
- [x] **PAY-07**: Webhooks handle subscription events (create, update, cancel)
- [x] **PAY-08**: Features are gated based on subscription plan
- [x] **PAY-09**: Webhook processing is async with idempotency

### User Dashboard

- [x] **DASH-01**: User can view and edit profile (name, avatar)
- [x] **DASH-02**: User can manage account settings
- [x] **DASH-03**: User can switch between workspaces
- [x] **DASH-04**: User can view subscription status
- [x] **DASH-05**: Dashboard shows relevant metrics/activity

### Admin Dashboard

- [x] **ADMIN-01**: Admin can view all users
- [x] **ADMIN-02**: Admin can view user details and activity
- [x] **ADMIN-03**: Admin can view all subscriptions
- [x] **ADMIN-04**: Admin can view revenue metrics
- [x] **ADMIN-05**: Admin can view signup/active user metrics
- [x] **ADMIN-06**: Admin can impersonate user for debugging
- [x] **ADMIN-07**: Admin routes protected by role check

### Content & Landing

- [x] **CONT-01**: Landing page with hero section
- [x] **CONT-02**: Landing page with features section
- [x] **CONT-03**: Landing page with pricing preview
- [x] **CONT-04**: Landing page with CTA and footer
- [x] **CONT-05**: Blog system with MDX support
- [x] **CONT-06**: Blog posts have SEO meta tags
- [x] **CONT-07**: Blog index page with post listing

### SEO

- [x] **SEO-01**: All pages have proper meta tags
- [x] **SEO-02**: Sitemap generated automatically
- [x] **SEO-03**: robots.txt configured
- [x] **SEO-04**: Structured data (JSON-LD) for key pages
- [x] **SEO-05**: OpenGraph and Twitter cards configured

### Email

- [x] **EMAIL-01**: Welcome email sent on signup
- [x] **EMAIL-02**: Password reset email with secure link
- [x] **EMAIL-03**: Team invitation email with join link
- [x] **EMAIL-04**: Email templates built with React Email
- [x] **EMAIL-05**: Email preview available in development
- [x] **EMAIL-06**: Emails sent via Resend

### Internationalization

- [x] **I18N-01**: UI supports multiple languages
- [x] **I18N-02**: Language switcher in UI
- [x] **I18N-03**: User language preference persisted
- [x] **I18N-04**: Date/number formatting locale-aware

### Database

- [x] **DB-01**: PostgreSQL database with Drizzle ORM
- [x] **DB-02**: Database schema with migrations
- [x] **DB-03**: Seed script for development data
- [x] **DB-04**: Soft delete pattern (deleted_at timestamp)
- [x] **DB-05**: Multi-tenant data isolation

### UI & Design System

- [x] **UI-01**: Geist design system implemented
- [x] **UI-02**: Token-based styling (colors, spacing, typography)
- [x] **UI-03**: Atomic Design hierarchy (atoms, molecules, organisms)
- [x] **UI-04**: shadcn/ui components integrated
- [x] **UI-05**: Light and dark mode with system preference
- [x] **UI-06**: Responsive design for mobile/tablet/desktop
- [x] **UI-07**: Geist font family loaded

### Testing

- [x] **TEST-01**: Vitest configured for unit tests
- [x] **TEST-02**: Playwright configured for E2E tests
- [x] **TEST-03**: Example unit tests included
- [x] **TEST-04**: Example E2E tests included
- [x] **TEST-05**: Test coverage reporting

### Code Quality

- [x] **QUAL-01**: TypeScript strict mode enabled
- [x] **QUAL-02**: ESLint configured with Next.js rules
- [x] **QUAL-03**: Prettier configured for formatting
- [x] **QUAL-04**: Husky pre-commit hooks installed
- [x] **QUAL-05**: lint-staged runs on commit
- [x] **QUAL-06**: No `any` types allowed (eslint rule)

### CI/CD

- [x] **CICD-01**: GitHub Actions workflow for tests
- [x] **CICD-02**: GitHub Actions workflow for linting
- [x] **CICD-03**: GitHub Actions workflow for type checking
- [x] **CICD-04**: Preview deployments on PR

### Deployment

- [x] **DEPLOY-01**: Vercel one-click deploy works
- [x] **DEPLOY-02**: Environment variables documented
- [x] **DEPLOY-03**: Docker deployment option
- [x] **DEPLOY-04**: docker-compose for local development
- [x] **DEPLOY-05**: Production deployment checklist

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Security Enhancements

- **SEC-01**: MFA (two-factor authentication)
- **SEC-02**: Rate limiting on API routes
- **SEC-03**: CSRF protection patterns

### Monitoring

- **MON-01**: Sentry error tracking integration
- **MON-02**: Structured logging with Pino
- **MON-03**: Uptime monitoring guidance

### Analytics

- **ANAL-01**: Analytics integration (Plausible/PostHog/Vercel)
- **ANAL-02**: Event tracking patterns
- **ANAL-03**: Conversion tracking

### Advanced Features

- **ADV-01**: Real-time features (WebSockets)
- **ADV-02**: CLI scaffolding tool
- **ADV-03**: White-label support
- **ADV-04**: Usage-based billing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app (React Native) | Web-first focus; mobile is separate project |
| Custom authentication | Better Auth handles all auth; no custom JWT/sessions |
| Page Router | Next.js 15+ uses App Router exclusively |
| Class components | Functional components + hooks only |
| Redux/Zustand | Context + hooks sufficient; no complex state management |
| CSS Modules | Tailwind CSS only |
| Multiple ORMs | Drizzle ORM only (no Prisma) |
| Real-time chat | High complexity, not core to boilerplate |
| Video uploads | Storage/bandwidth complexity |
| Affiliate program | Post-MVP if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | 3 | Complete |
| AUTH-02 | 3 | Complete |
| AUTH-03 | 3 | Complete |
| AUTH-04 | 3 | Complete |
| AUTH-05 | 3 | Complete |
| AUTH-06 | 3 | Complete |
| AUTH-07 | 3 | Complete |
| AUTH-08 | 3 | Complete |
| TEAM-01 | 6 | Complete |
| TEAM-02 | 6 | Complete |
| TEAM-03 | 6 | Complete |
| TEAM-04 | 6 | Complete |
| TEAM-05 | 6 | Complete |
| TEAM-06 | 6 | Complete |
| TEAM-07 | 6 | Complete |
| PAY-01 | 9 | Complete |
| PAY-02 | 9 | Complete |
| PAY-03 | 9 | Complete |
| PAY-04 | 9 | Complete |
| PAY-05 | 9 | Complete |
| PAY-06 | 9 | Complete |
| PAY-07 | 9 | Complete |
| PAY-08 | 9 | Complete |
| PAY-09 | 9 | Complete |
| DASH-01 | 8 | Complete |
| DASH-02 | 8 | Complete |
| DASH-03 | 8 | Complete |
| DASH-04 | 8 | Complete |
| DASH-05 | 8 | Complete |
| ADMIN-01 | 10 | Complete |
| ADMIN-02 | 10 | Complete |
| ADMIN-03 | 10 | Complete |
| ADMIN-04 | 10 | Complete |
| ADMIN-05 | 10 | Complete |
| ADMIN-06 | 10 | Complete |
| ADMIN-07 | 10 | Complete |
| CONT-01 | 5 | Complete |
| CONT-02 | 5 | Complete |
| CONT-03 | 5 | Complete |
| CONT-04 | 5 | Complete |
| CONT-05 | 11 | Complete |
| CONT-06 | 11 | Complete |
| CONT-07 | 11 | Complete |
| SEO-01 | 11 | Complete |
| SEO-02 | 11 | Complete |
| SEO-03 | 11 | Complete |
| SEO-04 | 11 | Complete |
| SEO-05 | 11 | Complete |
| EMAIL-01 | 7 | Complete |
| EMAIL-02 | 7 | Complete |
| EMAIL-03 | 7 | Complete |
| EMAIL-04 | 7 | Complete |
| EMAIL-05 | 7 | Complete |
| EMAIL-06 | 7 | Complete |
| I18N-01 | 4 | Complete |
| I18N-02 | 4 | Complete |
| I18N-03 | 4 | Complete |
| I18N-04 | 4 | Complete |
| DB-01 | 2 | Complete |
| DB-02 | 2 | Complete |
| DB-03 | 2 | Complete |
| DB-04 | 2 | Complete |
| DB-05 | 2 | Complete |
| UI-01 | 4 | Complete |
| UI-02 | 4 | Complete |
| UI-03 | 4 | Complete |
| UI-04 | 4 | Complete |
| UI-05 | 4 | Complete |
| UI-06 | 4 | Complete |
| UI-07 | 4 | Complete |
| TEST-01 | 12 | Complete |
| TEST-02 | 12 | Complete |
| TEST-03 | 12 | Complete |
| TEST-04 | 12 | Complete |
| TEST-05 | 12 | Complete |
| QUAL-01 | 1 | Complete |
| QUAL-02 | 1 | Complete |
| QUAL-03 | 1 | Complete |
| QUAL-04 | 1 | Complete |
| QUAL-05 | 1 | Complete |
| QUAL-06 | 1 | Complete |
| CICD-01 | 1 | Complete |
| CICD-02 | 1 | Complete |
| CICD-03 | 1 | Complete |
| CICD-04 | 1 | Complete |
| DEPLOY-01 | 12 | Complete |
| DEPLOY-02 | 12 | Complete |
| DEPLOY-03 | 12 | Complete |
| DEPLOY-04 | 12 | Complete |
| DEPLOY-05 | 12 | Complete |

**Coverage:**
- v1 requirements: 90 total
- Mapped to phases: 90
- Unmapped: 0 ✓

---

*Requirements defined: 2025-02-05*
*Last updated: 2026-02-06 after v1 implementation verification*
