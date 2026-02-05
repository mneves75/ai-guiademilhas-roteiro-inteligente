# NextJS Bootstrapped Shipped

## What This Is

An open-source Next.js 15 boilerplate for developers frustrated with outdated starters. Clone it, see everything working in a full demo app, strip what you don't need, ship fast. Built on the latest stack (React 19, Better Auth, Drizzle, Stripe) with Vercel's Geist design system.

## Core Value

Auth + protected routes work flawlessly. Everything else (payments, dashboard, content) builds on authenticated users being able to sign up, log in, and access gated content reliably.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication with Better Auth (sign up, login, logout, password reset)
- [ ] Protected routes with middleware-based auth checks
- [ ] Database setup with Drizzle ORM (Postgres/MySQL/SQLite compatible)
- [ ] Stripe integration (subscriptions + one-time payments)
- [ ] Admin dashboard with user management and metrics
- [ ] Blog/MDX content system
- [ ] SEO setup (meta tags, sitemap, robots.txt, structured data)
- [ ] Analytics integration ready (Plausible/PostHog/Vercel Analytics)
- [ ] Transactional emails with Resend + React Email
- [ ] Geist design system with token-based styling
- [ ] Light and dark mode with system preference detection
- [ ] Vercel one-click deploy support
- [ ] Docker self-hosted deployment option

### Out of Scope

- OAuth providers (Google, GitHub, etc.) — Better Auth supports these, add yourself if needed
- Real-time features (WebSockets, subscriptions) — not core to boilerplate purpose
- Mobile app (React Native) — web-first focus
- Multi-tenancy / organizations — keep it simple for v1
- Internationalization (i18n) — add yourself if needed

## Context

**Why this exists:**
Existing Next.js boilerplates (shipfast, taxonomy, etc.) are often outdated — not using Next.js 15, React 19, or modern tooling like Better Auth and Drizzle. Developers waste time upgrading dependencies before they can ship.

**Target users:**
Developers who want a modern, full-featured starting point. They'll clone, explore the working demo, understand the patterns, then customize for their product.

**Design philosophy:**
Following Vercel's Geist design system approach:
- Token-based styling (colors, spacing, typography, radius)
- Atomic Design hierarchy (atoms → molecules → organisms)
- Open, transparent components (no hidden complexity)
- Composable, consistent APIs
- shadcn/ui as the component foundation

**V1 scope:**
Full working demo app — not just scaffolding. Users see everything in action: auth flows, payment checkout, admin dashboard, blog posts, dark mode toggle.

## Constraints

- **Stack**: Next.js 15 + React 19 + TypeScript (non-negotiable for "modern" positioning)
- **Package manager**: pnpm (faster, efficient disk usage)
- **Auth**: Better Auth (self-hosted, modern alternative to NextAuth)
- **ORM**: Drizzle (lightweight, flexible, supports multiple databases)
- **Payments**: Stripe (industry standard)
- **UI**: Tailwind CSS + shadcn/ui + Geist design tokens
- **Fonts**: Geist font family (Vercel's typeface)
- **Email**: Resend + React Email
- **Deployment**: Must work on both Vercel (optimized) and Docker (self-hosted)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Better Auth over NextAuth | Modern, self-hosted, better DX, growing ecosystem | — Pending |
| Drizzle over Prisma | Lighter, faster, SQL-like syntax, edge compatible | — Pending |
| Geist design system | Vercel's proven approach, AI-friendly, token-based | — Pending |
| pnpm over Bun | Wider compatibility for open source project | — Pending |
| Full demo over scaffolding | Users learn by seeing, not just reading docs | — Pending |

---
*Last updated: 2025-02-05 after initialization*
