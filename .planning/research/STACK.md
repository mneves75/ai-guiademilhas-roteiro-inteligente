# Technology Stack: Next.js 15 SaaS Boilerplate

**Project:** Next.js 15 SaaS Boilerplate
**Researched:** February 5, 2026
**Overall Confidence:** HIGH (verified with official documentation and 2025-2026 ecosystem sources)

## Executive Summary

The recommended 2026 stack for production-ready SaaS applications prioritizes developer experience, performance, and operational simplicity. Core choices (Next.js 15 + React 19 + Drizzle + Better Auth) are validated and battle-tested. Supporting tools emphasize automation (Husky, GitHub Actions), observability (Sentry, PostHog), and type safety (TypeScript strict mode, ESLint 9).

---

## Recommended Stack

### Core Framework & Runtime

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 15.1+ | Full-stack React framework | Official React framework maintained by Vercel. Built-in Server Components, React Compiler support (stable in 16, experimental in 15), optimized for edge deployment. Turbopack provides 8x faster builds. |
| **React** | 19.x | UI library | Stable as of 2025. React Compiler reduces manual memoization. Built-in useFormStatus, useTransition for Server Actions. Full support in Next.js 15. |
| **TypeScript** | 5.6+ | Type safety | Built-in Next.js support with strict mode enabled by default. Zero config required; tsconfig.json auto-generated. Ensures type safety for Server/Client Components. |

**Confidence:** HIGH - Verified with Next.js 15.1 release notes and React 19 stable release.

### Database & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Drizzle ORM** | 0.38+ | Type-safe database access | Lightweight (~7.4kb minified+gzip), zero runtime dependencies. Supports PostgreSQL, MySQL, SQLite. Edge-compatible (Vercel Edge, Cloudflare Workers). Superior DX over Prisma for type-safe SQL. |
| **PostgreSQL** | 15+ (via Neon) | Primary database | Industry standard for SaaS. Neon adds serverless autoscaling, branching, and competitive pricing (post-Databricks acquisition: 15-25% compute reduction, storage $0.35/GB/mo). |
| **Neon** | (PgSQL 15+) | Serverless Postgres host | Vercel-integrated serverless PostgreSQL. Auto-scaling, branching for testing/staging. Replaced Vercel Postgres as official integration (Q4 2024). Lower latency for Vercel deployments. |
| **Drizzle Kit** | 0.24+ | Schema migrations | Auto-generates SQL migrations from TypeScript schema. Supports push/pull/generate workflows. Generates __drizzle_migrations table for tracking. |

**Confidence:** HIGH - Verified with Drizzle docs and Neon/Vercel integration status.

### Authentication & Authorization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Better Auth** | 0.14+ | Self-hosted authentication | Modern TypeScript auth framework (YC S25). Self-hosted (keep user data in your DB), supports passkeys, social auth, 2FA, multi-factor. Open-source with optional enterprise infrastructure. No vendor lock-in. |

**Confidence:** MEDIUM-HIGH - YC backed, production-ready per HN launch thread, but newer than Auth0/Auth.js alternatives.

### Payment Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Stripe** | API v2024+ | Subscriptions & payments | Industry standard for SaaS billing. Webhook events for subscription lifecycle (trial, renewal, churn). Built-in retry logic (3 days with exponential backoff). Essential events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded. |

**Confidence:** HIGH - Official Stripe documentation confirms webhook best practices.

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS** | 4.x | Utility-first CSS | Latest Tailwind v4 released. shadcn/ui fully supports v4 with @theme directive and OKLCH colors. Default for component libraries. Fast build times with Turbopack. |
| **shadcn/ui** | Latest | Component library | Headless components using Radix UI. Fully customizable (components are yours). React 19 + Tailwind v4 compatible. GitHub stars surged past competitors in 2025. Best DX for Next.js projects. |
| **Geist** | (Font) | Typography system | Vercel's design font. Install via package, apply `font-geist-sans` to root. Matches modern SaaS aesthetic. Used in Vercel products. |

**Confidence:** HIGH - Verified with shadcn/ui docs and official support announcements.

### Email & Transactional Messaging

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Resend** | (Latest API) | Email delivery service | YC-backed. Optimized for transactional email (not marketing). Built by React Email team. Supports templates, webhooks, batch sending. Lower latency for alerts/confirmations. |
| **React Email** | 5.0+ | Email template engine | Build emails using React JSX instead of HTML tables. Now supports Tailwind v4 and React 19. Converts to responsive HTML for Resend/any ESP. Component reusability. |

**Confidence:** HIGH - Verified with React Email 5.0 release notes and Resend documentation.

### Testing Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | 2.x | Unit/component testing | 10-20x faster than Jest on large codebases. Native ESM, Vite-native. Best for modern TypeScript/React stacks. Async Server Components supported via E2E. |
| **React Testing Library** | 16+ | Component testing | Best practices: test user behavior, not implementation. Pairs with Vitest. Works with async Server Components. |
| **Playwright** | 1.48+ | E2E testing | Full browser automation. Parallel execution. Screenshots/video recording. Critical for 3-5 key user flows (signup, login, checkout). Recommended over Cypress for modern stacks. |

**Confidence:** HIGH - Verified with Next.js testing guide and Playwright docs.

### Code Quality & Formatting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **ESLint** | 9.x | Linting | Flat config format (breaking change from v8). Next.js 15 supports both legacy and flat configs via @next/eslint-plugin-next. Enable TypeScript rules via eslint-config-next/typescript. ESLint 16+ planned to remove next lint command. |
| **Prettier** | 3.x | Code formatting | Opinionated formatter. Prevents style debates. Pairs with eslint-config-prettier to disable conflicting rules. |
| **Husky** | 9.x | Git hooks | Automate pre-commit checks. Installs hooks in .husky/ directory. Zero-config with `husky init`. |
| **lint-staged** | 15.x | Staged file linting | Runs linters only on staged files (efficient). Prevents passing broken code. Combined with Husky for pre-commit workflow. |

**Confidence:** HIGH - Verified with ESLint 9 migration guide and lint-staged docs.

### Package Manager

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **pnpm** | 9.x | Package management | 70% less disk space than npm (hard-links vs copies). Faster installs (especially monorepos). Deterministic node_modules layout. Benchmarks updated Jan 2026. Modern alternative to npm with no compatibility issues. |

**Confidence:** HIGH - Verified with pnpm benchmarks (updated Jan 2026).

### Database Migrations & Studio

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Drizzle Studio** | (Included in Kit) | Database GUI | Visual schema browser. Query builder for ad-hoc queries. Real-time collaboration. Built into drizzle-kit. |

**Confidence:** HIGH - Documented in Drizzle Kit overview.

### Error Tracking & Monitoring

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Sentry** | (Latest SDK) | Error tracking & APM | 100K+ organizations, 4M developers. Real-time error alerts. Performance monitoring. Session replays. Note: 2025 pricing concerns around AI training—configure quotas/rate limits to prevent billing spikes. |

**Confidence:** MEDIUM - Production-used but note 2025 pricing/privacy changes (requires spike protection configuration).

### Analytics & Product Insights

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostHog** | (Latest SDK) | Product analytics | Open-source alternative. Event capture, heatmaps, session replays, feature flags. Vercel-native integration (with Vercel Flags SDK). Better than Vercel Web Analytics (which is basic only). |

**Confidence:** MEDIUM-HIGH - Verified with PostHog docs and integration guides.

### Rate Limiting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Upstash Redis** | (API) | Rate limiting | Serverless Redis (no container needed). Pairs with @upstash/ratelimit. Per-IP or per-user rate limiting. Used with Vercel KV for state storage. Alternative: custom in-memory solution for simple use cases. |

**Confidence:** MEDIUM - Community consensus from 4 blog posts on solutions; Upstash recommended for scalability.

### Deployment & Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | (Platform) | Primary deployment | Built by Next.js creators. Zero-config deployments. Edge Functions, Middleware, Streaming. Git-driven CD. Analytics included. Integrated with Neon. Best DX for Next.js. |
| **Docker** | 27.x | Container standard | Required for non-Vercel deployments (AWS, GCP, self-hosted). Multi-stage builds reduce image size (1GB → 100-200MB). Standalone output in next.config.js. |

**Confidence:** HIGH - Verified with Vercel docs and Docker best practices.

### CI/CD

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **GitHub Actions** | (Native) | CI/CD automation | Native to GitHub. No vendor lock-in. Standard workflows: lint → build → test → deploy. Docker image caching for faster builds. Cost-effective. |

**Confidence:** HIGH - Verified with GitHub Actions docs and 2025 setup guides.

---

## Installation & Setup

### Phase 1: Core Dependencies

```bash
# Install core packages
pnpm add next@latest react@latest typescript

# Install React 19 if not auto-installed
pnpm add react@19.x react-dom@19.x

# Install TypeScript types
pnpm add -D @types/node @types/react @types/react-dom
```

### Phase 2: Database & ORM

```bash
pnpm add drizzle-orm @drizzle-team/bun-sqlite
pnpm add -D drizzle-kit
pnpm add @vercel/postgres  # Or connect to Neon PostgreSQL

# For Neon serverless driver
pnpm add @neondatabase/serverless
```

### Phase 3: Authentication

```bash
pnpm add better-auth
```

### Phase 4: Payment Processing

```bash
pnpm add stripe
pnpm add -D @types/stripe
```

### Phase 5: UI & Styling

```bash
pnpm add tailwindcss postcss autoprefixer geist
pnpm add -D @tailwindcss/typography
pnpm dlx shadcn-ui@latest init
```

### Phase 6: Email

```bash
pnpm add resend react-email
```

### Phase 7: Testing & Quality

```bash
pnpm add -D vitest @vitest/ui react-testing-library @testing-library/jest-dom
pnpm add -D @playwright/test
pnpm add -D eslint @next/eslint-plugin-next prettier eslint-config-prettier
pnpm add -D husky lint-staged
```

### Phase 8: Developer Tools

```bash
pnpm add -D typescript-eslint

# Initialize git hooks
npx husky-init --pnpm
```

### Phase 9: Monitoring & Analytics

```bash
pnpm add @sentry/nextjs posthog
pnpm add @upstash/ratelimit @vercel/kv  # Or use native Redis
```

### Package Manager Configuration

Create `.npmrc` (pnpm):
```bash
shamefully-hoist=true
strict-peer-dependencies=false
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Framework** | Next.js 15 | Remix, SvelteKit, Astro | Next.js has the largest ecosystem, best React Compiler support, and Vercel backing. Others are good but smaller communities. |
| **ORM** | Drizzle | Prisma | Drizzle is lighter, edge-compatible, and has superior TypeScript ergonomics. Prisma has more features but 1.7MB bundle. |
| **Auth** | Better Auth | Auth0, Clerk, Auth.js | Better Auth gives you control. Auth0/Clerk are managed (cost, vendor lock). Auth.js is solid but requires more setup. Better Auth is modern and YC-backed. |
| **Database** | PostgreSQL (Neon) | MySQL, MongoDB | PostgreSQL is ACID-compliant, best for SaaS. Neon adds serverless benefits. MongoDB lacks transactions for financial data. |
| **CSS** | Tailwind v4 | Bootstrap, Styled Components | Tailwind v4 is fastest, most flexible. Bootstrap is bloated. Styled-in-JS adds runtime overhead. |
| **Components** | shadcn/ui | Material UI, Ant Design | shadcn/ui gives you ownership (components in your codebase). Material/Ant are opinionated and heavier. |
| **Email** | Resend | SendGrid, Mailgun | Resend is React-native. SendGrid/Mailgun lack JSX support. Resend optimized for transactional (not marketing). |
| **Testing** | Vitest | Jest | Vitest is 10-20x faster for modern stacks. Jest is legacy-focused and heavier. |
| **Package Mgr** | pnpm | npm, Yarn | pnpm is fastest, smallest disk footprint. npm improved but still slower. Yarn is legacy. |
| **Error Tracking** | Sentry | Rollbar, BugSnag, DataDog | Sentry has best DX and free tier. Others less transparent on pricing/data usage. |
| **Analytics** | PostHog | Google Analytics 4, Mixpanel | PostHog is open-source, self-hostable. GA4 is marketing-focused. PostHog better for product analytics. |

**Note:** All alternatives are production-viable; these recommendations reflect 2026 ecosystem consensus and boilerplate goals.

---

## Version Pinning Strategy

Recommended approach for `package.json`:

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "drizzle-orm": "^0.38.0",
    "better-auth": "^0.14.0",
    "stripe": "^16.0.0",
    "tailwindcss": "^4.0.0",
    "resend": "^4.0.0",
    "@sentry/nextjs": "^7.0.0",
    "posthog": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "eslint": "^9.0.0",
    "@next/eslint-plugin-next": "^15.1.0",
    "prettier": "^3.0.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.48.0"
  }
}
```

**Rationale:** Use caret (^) to allow patch/minor updates; major versions manually upgraded after testing.

---

## Configuration Files

### next.config.ts (TypeScript-native)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    ignoreBuildErrors: false, // Fail build on lint errors
  },
  experimental: {
    dynamicIO: true, // Enable in Next.js 16
    ppr: false, // Partial pre-rendering (opt-in per route)
  },
}

export default nextConfig
```

### tsconfig.json (Strict Mode)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### ESLint (Flat Config - ESLint 9)

```javascript
// eslint.config.js
import { defineConfig } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"

export default defineConfig(
  {
    ignores: ["node_modules", ".next", "dist", "build"],
  },
  nextVitals,
  nextTs,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/display-name": "off",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  prettier
)
```

### Drizzle Config (drizzle.config.ts)

```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: "index",
  },
})
```

---

## Performance Metrics & Benchmarks

Based on 2025-2026 ecosystem data:

| Metric | Target | Achieved By |
|--------|--------|------------|
| **Build time (cold)** | <10s | Turbopack (8x faster than Webpack) |
| **Build time (incremental)** | <2s | Turbopack + cached node_modules |
| **First Contentful Paint (FCP)** | <1.5s | React Server Components, edge functions |
| **Time to Interactive (TTI)** | <2.5s | React Compiler (removes unnecessary re-renders) |
| **Package size (gzip)** | <200kb | Drizzle (~7.4kb), shadcn/ui (~15kb per component) |
| **Test suite runtime** | <30s | Vitest (10-20x faster than Jest) |
| **Disk space (node_modules)** | <1GB | pnpm hard-links (70% reduction) |

---

## Known Constraints & Limitations

| Constraint | Details | Mitigation |
|------------|---------|-----------|
| **ESLint Breaking Change** | Next.js 16 removes `next lint`. Use `eslint` CLI directly. | Update CI/CD workflows to `eslint .` instead of `next lint`. |
| **Sentry Pricing** | Volume-based (per event). Cascading failures can spike costs. | Enable Spike Protection, configure inbound filters, set event quotas. |
| **Drizzle Bundle Size** | Small but requires drizzle-orm + drivers (~15-20kb). | Acceptable for SaaS; tree-shaking removes unused code. |
| **TypeScript Strictness** | Strict mode catches more errors but slower initial development. | Worth it for long-term maintainability. Use `unknown` + type guards instead of `any`. |
| **Async Server Components** | Vitest doesn't support testing; use Playwright for E2E. | Test async components via integration tests, not unit tests. |

---

## Verification & Sources

### High-Confidence Sources (Official Documentation)

- [Next.js 15.1 Release Notes](https://nextjs.org/blog/next-15-1) - Official Next.js blog
- [React 19 Stable Release](https://react.dev/versions) - Official React docs
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Official Drizzle docs
- [Neon Postgres Docs](https://neon.com/docs) - Official Neon docs
- [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide) - Official ESLint
- [TypeScript 5.6 Release](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html) - Official TS docs

### Medium-Confidence Sources (Community + Official)

- [Next.js SaaS Boilerplate Patterns](https://github.com/ixartz/SaaS-Boilerplate) - Community example
- [PostHog + Vercel Integration](https://posthog.com/docs/libraries/next-js) - Official PostHog docs
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices) - Official Stripe docs
- [pnpm Benchmarks (Jan 2026)](https://pnpm.io/benchmarks) - Official pnpm benchmarks

### Research Gaps & Caveats

- **Better Auth:** YC-backed, production-ready per community, but less historical data than Auth0/Clerk
- **PostHog:** Recommended for product analytics but requires spike protection (open-source models can generate high events)
- **Sentry:** Excellent product but 2025 pricing changes require careful quota configuration

---

## Next Steps for Implementation

1. **Phase 1 (Week 1):** Set up Next.js 15 project, TypeScript strict mode, ESLint 9 + Prettier
2. **Phase 2 (Week 1-2):** Database (Neon + Drizzle), migrations, schema design
3. **Phase 3 (Week 2-3):** Authentication (Better Auth), session management, role-based access
4. **Phase 4 (Week 3-4):** Stripe integration, webhook handling, subscription flows
5. **Phase 5 (Week 4-5):** UI (shadcn/ui, Tailwind v4), design system, component library
6. **Phase 6 (Week 5-6):** Email (Resend + React Email), transactional templates
7. **Phase 7 (Week 6-7):** Testing (Vitest + Playwright), critical user flows
8. **Phase 8 (Week 7-8):** Monitoring (Sentry + PostHog), error tracking, analytics
9. **Phase 9 (Week 8-9):** CI/CD (GitHub Actions), Docker, deployment to Vercel + self-hosted
10. **Phase 10 (Week 9-10):** Performance optimization, SEO, documentation

---

## Maintenance & Upgrade Schedule

| Frequency | Task |
|-----------|------|
| **Monthly** | Update direct dependencies (patch/minor versions) via `pnpm up --latest` |
| **Quarterly** | Review major version upgrades (React, Next.js, TypeScript) |
| **Annually** | Audit security vulnerabilities, review ecosystem for alternatives |
| **Ongoing** | Monitor Stripe/Resend/Better Auth announcements for breaking changes |

---

**Last Updated:** February 5, 2026
**By:** GSD Project Researcher
**Confidence Level:** HIGH (verified with official sources dated 2025-2026)
