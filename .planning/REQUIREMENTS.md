# Requirements: NextJS Bootstrapped Shipped

**Defined:** 2025-02-05
**Core Value:** Auth + protected routes work flawlessly. Everything builds on authenticated users being able to sign up, log in, and access gated content reliably.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can sign up/login with OAuth (Google, GitHub)
- [ ] **AUTH-03**: User can log in and stay logged in across sessions
- [ ] **AUTH-04**: User can log out from any page
- [ ] **AUTH-05**: User can reset password via email link
- [ ] **AUTH-06**: User can log in via magic link (passwordless)
- [ ] **AUTH-07**: Protected routes redirect unauthenticated users to login
- [ ] **AUTH-08**: Middleware handles auth checks for protected routes

### Multi-Tenancy & Teams

- [ ] **TEAM-01**: User can create a workspace/team
- [ ] **TEAM-02**: User can switch between workspaces
- [ ] **TEAM-03**: Owner can invite members via email
- [ ] **TEAM-04**: Invited user receives email with invitation link
- [ ] **TEAM-05**: Owner can remove members from workspace
- [ ] **TEAM-06**: Owner can change member roles (owner/member)
- [ ] **TEAM-07**: Data is isolated per workspace (multi-tenant)

### Payments (Stripe)

- [ ] **PAY-01**: User can view pricing page with plan options
- [ ] **PAY-02**: Pricing page auto-generates from configuration
- [ ] **PAY-03**: User can subscribe to a plan (monthly/yearly)
- [ ] **PAY-04**: User can cancel subscription
- [ ] **PAY-05**: User can access Stripe customer portal
- [ ] **PAY-06**: User can make one-time payments
- [ ] **PAY-07**: Webhooks handle subscription events (create, update, cancel)
- [ ] **PAY-08**: Features are gated based on subscription plan
- [ ] **PAY-09**: Webhook processing is async with idempotency

### User Dashboard

- [ ] **DASH-01**: User can view and edit profile (name, avatar)
- [ ] **DASH-02**: User can manage account settings
- [ ] **DASH-03**: User can switch between workspaces
- [ ] **DASH-04**: User can view subscription status
- [ ] **DASH-05**: Dashboard shows relevant metrics/activity

### Admin Dashboard

- [ ] **ADMIN-01**: Admin can view all users
- [ ] **ADMIN-02**: Admin can view user details and activity
- [ ] **ADMIN-03**: Admin can view all subscriptions
- [ ] **ADMIN-04**: Admin can view revenue metrics
- [ ] **ADMIN-05**: Admin can view signup/active user metrics
- [ ] **ADMIN-06**: Admin can impersonate user for debugging
- [ ] **ADMIN-07**: Admin routes protected by role check

### Content & Landing

- [ ] **CONT-01**: Landing page with hero section
- [ ] **CONT-02**: Landing page with features section
- [ ] **CONT-03**: Landing page with pricing preview
- [ ] **CONT-04**: Landing page with CTA and footer
- [ ] **CONT-05**: Blog system with MDX support
- [ ] **CONT-06**: Blog posts have SEO meta tags
- [ ] **CONT-07**: Blog index page with post listing

### SEO

- [ ] **SEO-01**: All pages have proper meta tags
- [ ] **SEO-02**: Sitemap generated automatically
- [ ] **SEO-03**: robots.txt configured
- [ ] **SEO-04**: Structured data (JSON-LD) for key pages
- [ ] **SEO-05**: OpenGraph and Twitter cards configured

### Email

- [ ] **EMAIL-01**: Welcome email sent on signup
- [ ] **EMAIL-02**: Password reset email with secure link
- [ ] **EMAIL-03**: Team invitation email with join link
- [ ] **EMAIL-04**: Email templates built with React Email
- [ ] **EMAIL-05**: Email preview available in development
- [ ] **EMAIL-06**: Emails sent via Resend

### Internationalization

- [ ] **I18N-01**: UI supports multiple languages
- [ ] **I18N-02**: Language switcher in UI
- [ ] **I18N-03**: User language preference persisted
- [ ] **I18N-04**: Date/number formatting locale-aware

### Database

- [ ] **DB-01**: PostgreSQL database with Drizzle ORM
- [ ] **DB-02**: Database schema with migrations
- [ ] **DB-03**: Seed script for development data
- [ ] **DB-04**: Soft delete pattern (deleted_at timestamp)
- [ ] **DB-05**: Multi-tenant data isolation

### UI & Design System

- [ ] **UI-01**: Geist design system implemented
- [ ] **UI-02**: Token-based styling (colors, spacing, typography)
- [ ] **UI-03**: Atomic Design hierarchy (atoms, molecules, organisms)
- [ ] **UI-04**: shadcn/ui components integrated
- [ ] **UI-05**: Light and dark mode with system preference
- [ ] **UI-06**: Responsive design for mobile/tablet/desktop
- [ ] **UI-07**: Geist font family loaded

### Testing

- [ ] **TEST-01**: Vitest configured for unit tests
- [ ] **TEST-02**: Playwright configured for E2E tests
- [ ] **TEST-03**: Example unit tests included
- [ ] **TEST-04**: Example E2E tests included
- [ ] **TEST-05**: Test coverage reporting

### Code Quality

- [ ] **QUAL-01**: TypeScript strict mode enabled
- [ ] **QUAL-02**: ESLint configured with Next.js rules
- [ ] **QUAL-03**: Prettier configured for formatting
- [ ] **QUAL-04**: Husky pre-commit hooks installed
- [ ] **QUAL-05**: lint-staged runs on commit
- [ ] **QUAL-06**: No `any` types allowed (eslint rule)

### CI/CD

- [ ] **CICD-01**: GitHub Actions workflow for tests
- [ ] **CICD-02**: GitHub Actions workflow for linting
- [ ] **CICD-03**: GitHub Actions workflow for type checking
- [ ] **CICD-04**: Preview deployments on PR

### Deployment

- [ ] **DEPLOY-01**: Vercel one-click deploy works
- [ ] **DEPLOY-02**: Environment variables documented
- [ ] **DEPLOY-03**: Docker deployment option
- [ ] **DEPLOY-04**: docker-compose for local development
- [ ] **DEPLOY-05**: Production deployment checklist

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
| AUTH-01 | 3 | Pending |
| AUTH-02 | 3 | Pending |
| AUTH-03 | 3 | Pending |
| AUTH-04 | 3 | Pending |
| AUTH-05 | 3 | Pending |
| AUTH-06 | 3 | Pending |
| AUTH-07 | 3 | Pending |
| AUTH-08 | 3 | Pending |
| TEAM-01 | 6 | Pending |
| TEAM-02 | 6 | Pending |
| TEAM-03 | 6 | Pending |
| TEAM-04 | 6 | Pending |
| TEAM-05 | 6 | Pending |
| TEAM-06 | 6 | Pending |
| TEAM-07 | 6 | Pending |
| PAY-01 | 9 | Pending |
| PAY-02 | 9 | Pending |
| PAY-03 | 9 | Pending |
| PAY-04 | 9 | Pending |
| PAY-05 | 9 | Pending |
| PAY-06 | 9 | Pending |
| PAY-07 | 9 | Pending |
| PAY-08 | 9 | Pending |
| PAY-09 | 9 | Pending |
| DASH-01 | 8 | Pending |
| DASH-02 | 8 | Pending |
| DASH-03 | 8 | Pending |
| DASH-04 | 8 | Pending |
| DASH-05 | 8 | Pending |
| ADMIN-01 | 10 | Pending |
| ADMIN-02 | 10 | Pending |
| ADMIN-03 | 10 | Pending |
| ADMIN-04 | 10 | Pending |
| ADMIN-05 | 10 | Pending |
| ADMIN-06 | 10 | Pending |
| ADMIN-07 | 10 | Pending |
| CONT-01 | 5 | Pending |
| CONT-02 | 5 | Pending |
| CONT-03 | 5 | Pending |
| CONT-04 | 5 | Pending |
| CONT-05 | 11 | Pending |
| CONT-06 | 11 | Pending |
| CONT-07 | 11 | Pending |
| SEO-01 | 11 | Pending |
| SEO-02 | 11 | Pending |
| SEO-03 | 11 | Pending |
| SEO-04 | 11 | Pending |
| SEO-05 | 11 | Pending |
| EMAIL-01 | 7 | Pending |
| EMAIL-02 | 7 | Pending |
| EMAIL-03 | 7 | Pending |
| EMAIL-04 | 7 | Pending |
| EMAIL-05 | 7 | Pending |
| EMAIL-06 | 7 | Pending |
| I18N-01 | 4 | Pending |
| I18N-02 | 4 | Pending |
| I18N-03 | 4 | Pending |
| I18N-04 | 4 | Pending |
| DB-01 | 2 | Pending |
| DB-02 | 2 | Pending |
| DB-03 | 2 | Pending |
| DB-04 | 2 | Pending |
| DB-05 | 2 | Pending |
| UI-01 | 4 | Pending |
| UI-02 | 4 | Pending |
| UI-03 | 4 | Pending |
| UI-04 | 4 | Pending |
| UI-05 | 4 | Pending |
| UI-06 | 4 | Pending |
| UI-07 | 4 | Pending |
| TEST-01 | 12 | Pending |
| TEST-02 | 12 | Pending |
| TEST-03 | 12 | Pending |
| TEST-04 | 12 | Pending |
| TEST-05 | 12 | Pending |
| QUAL-01 | 1 | Pending |
| QUAL-02 | 1 | Pending |
| QUAL-03 | 1 | Pending |
| QUAL-04 | 1 | Pending |
| QUAL-05 | 1 | Pending |
| QUAL-06 | 1 | Pending |
| CICD-01 | 1 | Pending |
| CICD-02 | 1 | Pending |
| CICD-03 | 1 | Pending |
| CICD-04 | 1 | Pending |
| DEPLOY-01 | 12 | Pending |
| DEPLOY-02 | 12 | Pending |
| DEPLOY-03 | 12 | Pending |
| DEPLOY-04 | 12 | Pending |
| DEPLOY-05 | 12 | Pending |

**Coverage:**
- v1 requirements: 90 total
- Mapped to phases: 90
- Unmapped: 0 ✓

---

*Requirements defined: 2025-02-05*
*Last updated: 2025-02-05 after roadmap creation*
