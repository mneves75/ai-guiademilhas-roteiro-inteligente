# Domain Pitfalls: Next.js SaaS Boilerplates

**Domain:** Next.js 15+ SaaS boilerplates
**Researched:** February 5, 2026
**Confidence:** HIGH (extensive ecosystem research, verified with official sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or abandonment of the boilerplate.

### Pitfall 1: Multi-Tenant Data Bleed via Weak Isolation

**What goes wrong:**
Customer A logs in and sees Customer B's sensitive data—financial records, PII, private business strategy. This is "Data Bleed," the most catastrophic failure mode in SaaS.

**Why it happens:**
- Row-Level Security (RLS) treated as the complete solution instead of a "safety net"
- Forgotten tenant filters on complex database joins
- Connection pool contamination from shared database sessions without proper reset
- Shared cache poisoning when tenant data isn't properly keyed
- Async context leaks in middleware or Server Components that leak tenant context across requests

**Consequences:**
- Immediate regulatory violations (GDPR, HIPAA, SOC 2)
- Complete loss of customer trust
- Potential lawsuits and business closure
- Requires database audit, possible schema redesign

**Warning signs:**
- Inconsistent tenant filtering across queries
- Single database pool without session reset (`DISCARD ALL`)
- Cached data without tenant-scoped keys
- Manual tenant context passing (error-prone)
- No integration tests verifying isolation between tenants

**Prevention:**
1. **Defense-in-Depth:** Assume database, cache, and connection pool will fail independently
2. **Connection Pool Reset:** Configure pooling proxy with `server_reset_query = 'DISCARD ALL'` to wipe temporary tables, session variables, prepared statements
3. **Mandatory Tenant Context:** Use explicit tenant context in all queries (ORM enforces via middleware)
4. **Cached Data Keys:** Always include tenant ID in cache keys (`cache_key = "data:${tenantId}:${id}"`)
5. **Async Context:** Use Node.js `AsyncLocalStorage` or Next.js request context to prevent leaks
6. **Integration Tests:** Write cross-tenant tests that verify Customer B cannot see Customer A's data
7. **Code Review:** Treat tenant filters like SQL injection—never skip them

**Phase mapping:**
- **Phase 2 (Architecture):** Design multi-tenant isolation strategy (connection pooling, cache keying, async context)
- **Phase 3 (Auth):** Implement middleware that validates tenant context on every request
- **Phase 4 (Database):** Set up pooling proxy with mandatory session reset
- **Phase 5 (Testing):** Build integration tests for cross-tenant isolation

**References:**
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)

---

### Pitfall 2: Authentication Bypass via Middleware Edge Runtime Limitations

**What goes wrong:**
Attackers bypass authentication checks. Session verification works in development, fails in production middleware. CVE-2025-29927 (CVSS 9.1) allows unauthenticated access to protected routes.

**Why it happens:**
- Middleware runs in Edge runtime (Cloudflare Workers, Vercel Edge), which doesn't support database queries
- Developers use JWT-only session strategy, but JWT validation is insufficient alone
- NextAuth.js v4/v5 transition: session persistence logic breaks if secrets are misconfigured
- Cookie attributes (secure, httpOnly, sameSite) don't match deployment environment
- No fallback when session verification fails (just continues)

**Consequences:**
- Immediate security breach—unauthorized access to user data and SaaS features
- Compliance failure
- Potential account takeovers

**Warning signs:**
- Session works locally, fails after deployment
- Middleware logs show "session undefined"
- JWT verification passes but user context is empty
- Cookie not persisting across requests
- NextAuth error logs mention "provider" or "secret" issues

**Prevention:**
1. **Session Strategy:** Use JWT in Edge (fast, stateless), verify database session in route handlers for sensitive operations
2. **Secret Management:** Ensure `NEXTAUTH_SECRET` is set in all environments, matches across builds
3. **Cookie Configuration:** Match cookie attributes to deployment (e.g., `secure: true` only in production)
4. **Middleware Design:** Keep middleware thin—only verify JWT, defer DB checks to route handlers
5. **Fallback Handling:** Explicitly redirect unauthenticated requests (never silently continue)
6. **Environment Parity:** Test auth in a production-like environment (Vercel preview, Docker)
7. **Monitoring:** Log session verification failures to catch patterns

**Phase mapping:**
- **Phase 3 (Auth):** Choose session strategy (JWT in Edge, DB in handlers), set up secrets correctly
- **Phase 3 (Middleware):** Design middleware with appropriate runtime constraints
- **Phase 5 (Testing):** End-to-end tests covering auth in production-like environment

**References:**
- [Detecting and Mitigating an Authorization Bypass Vulnerability in Next.js](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations)
- [Next.js Session Management: Solving NextAuth Persistence Issues in 2025](https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues)

---

### Pitfall 3: Server Actions Security—Treating "use server" as Private

**What goes wrong:**
Developers write `'use server'` functions assuming they're private. Attackers craft HTTP POST requests to invoke them with arbitrary arguments. Critical RSC bugs (December 2025) allow unauthenticated Remote Code Execution where attacker-supplied code runs on your server.

**Why it happens:**
- `'use server'` creates public API endpoints, but developers write them like private functions
- No authentication checks inside Server Actions (assumed safe because "server")
- React Flight deserialization vulnerability treats attacker-supplied code as trusted
- Error handling exposes sensitive info (stack traces, internal API details)
- useActionState has bugs with complex object states

**Consequences:**
- Remote code execution on your server
- Database compromise, file system access
- Complete system breach

**Warning signs:**
- No authentication checks in Server Actions
- Server Actions accepting complex objects without validation
- Detailed error messages returned to client
- useActionState state contains non-primitive types
- No logging of Server Action invocations

**Prevention:**
1. **Treat as Public API:** Every `'use server'` function is a public endpoint—require authentication and authorization
2. **Input Validation:** Always validate inputs; use Zod schemas even in Server Actions
3. **Authentication Gate:** First line: `if (!session) throw new Error("Unauthorized")`
4. **Error Handling:** Catch errors, log details server-side, return generic messages to client
5. **useActionState State:** Keep state simple (primitives, strings). For objects, serialize/deserialize explicitly
6. **Logging:** Log every Server Action invocation (who, what, when) for audit trails
7. **Code Review:** Security-focused review of all `'use server'` functions

**Phase mapping:**
- **Phase 3 (Auth):** Establish Server Action authentication pattern
- **Phase 4 (API):** Build Server Action validation and error handling
- **Phase 6 (Security):** Add logging and monitoring

**References:**
- [Critical RSC Bugs in React and Next.js Allow Unauthenticated Remote Code Execution](https://thehackernews.com/2025/12/critical-rsc-bugs-in-react-and-next-js.html)
- [Next.js Server Actions Security: 5 Vulnerabilities You Must Fix](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions)

---

### Pitfall 4: Outdated Stack—Framework and Dependencies Fall Behind

**What goes wrong:**
Boilerplate ships with Next.js 14, Prisma 4, React 18. Six months later:
- Next.js 15 released (React 19, Server Components default, new patterns)
- Security vulnerabilities in dependencies (OpenSSL, Node.js CVEs)
- Incompatibilities between misaligned versions
- Users fork boilerplate and manually update (defeats purpose of starter)

**Why it happens:**
- Boilerplate maintenance requires constant updates
- Testing every dependency bump against full stack is time-consuming
- No automated dependency management (e.g., Renovate)
- Documentation doesn't explain upgrade path
- Boilerplate doesn't follow framework release cycles

**Consequences:**
- Users abandon boilerplate within months
- Security vulnerabilities accumulate
- Users must reinvent upgrade process for each project
- Community splits into outdated and patched versions

**Warning signs:**
- Last commit > 3 months old
- Dependencies have security advisories (`npm audit`)
- Framework versions are 2+ releases behind latest
- README lacks "Last updated" date
- Issues about "does this work with Next.js 15" go unanswered

**Prevention:**
1. **Automated Updates:** Use Renovate or Dependabot to auto-create PRs for dependency updates
2. **Testing Strategy:** Comprehensive test suite (unit, integration, e2e) that runs on every update
3. **Versioning:** Use exact versions in package.json (not `^` or `~`) to avoid surprises
4. **Release Schedule:** Plan major updates with framework releases (Next.js, React)
5. **Documentation:** Maintain "Last Updated" date, upgrade guides for major versions
6. **Monitoring:** Set up alerts for security advisories
7. **Contribution Process:** Clear process for accepting PRs and cutting releases

**Phase mapping:**
- **Phase 1 (Setup):** Configure Renovate/Dependabot and CI/CD
- **Phase 7+ (Maintenance):** Automated updates, regular releases

**References:**
- [Managing Deprecated Packages, Package Size, Versioning, and Types in Next.js Projects](https://medium.com/@rameshkannanyt0078/managing-deprecated-packages-package-size-versioning-and-types-in-next-js-8643b53f914d)

---

## High Severity Pitfalls

Mistakes that cause major pain, data loss, or architectural compromises.

### Pitfall 5: Stripe Webhook Signature Verification Skipped

**What goes wrong:**
Developer skips webhook signature verification. Anyone can POST fake webhook data to your endpoint:
- Fake payment confirmations (grant access without paying)
- Fake subscription cancellations (revoke access)
- Fake refunds (credit user money)

**Why it happens:**
- Signature verification code is non-obvious
- Developers rush to "make it work" locally
- Testing tools often skip signature verification
- Raw body requirement (`req.text()`) not understood—automatic JSON parsing breaks verification

**Consequences:**
- Financial fraud—users get free access
- Revenue loss
- Compliance violations (PCI DSS)

**Warning signs:**
- Webhook handler uses `req.body` directly (not raw text)
- No signature verification code
- Webhook tests don't validate signatures
- Stripe webhook test tool shows "successful" but real webhooks fail

**Prevention:**
1. **Always Verify:** First line in webhook handler: verify Stripe signature using `stripe.webhooks.constructEvent()`
2. **Raw Body:** Use `req.text()` in App Router (not automatic JSON parsing)
3. **Event Handler Pattern:** Switch on `event.type`, handle each event explicitly
4. **Testing:** Use Stripe CLI (`stripe listen`) to receive real webhooks locally
5. **Logging:** Log every webhook (received, verified, processed, failed) with event type and ID
6. **Idempotent Processing:** Webhook might be delivered twice—idempotency key or database uniqueness prevents double-charges
7. **Error Handling:** Return 200 OK after verifying signature, even if event processing fails (Stripe retries)

**Phase mapping:**
- **Phase 4 (Payments):** Implement webhook handler with signature verification and event routing
- **Phase 5 (Testing):** Test webhook handler with Stripe CLI

**References:**
- [Stripe Webhook in Nextjs issue](https://github.com/vercel/next.js/discussions/48885)
- [How to Handle Stripe and Paystack Webhooks in Next.js](https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi)

---

### Pitfall 6: Hydration Mismatches from Server/Client Boundary Violations

**What goes wrong:**
Component renders one way on server, different way on client. React throws hydration error, UI freezes or corrupts. Common causes:
- Dark mode/theme applied on client before hydration (server renders light)
- `typeof window` check without proper boundary
- Date/random values differ between server and client render
- Crossing Server/Client boundary with unstable values

**Why it happens:**
- Developers new to App Router don't understand Server/Client contracts
- Theme systems inject CSS before React hydrates
- Date/time used without server-side initialization
- Props passed from Server to Client include functions or unstable values

**Consequences:**
- Interactive UI becomes unresponsive
- User thinks site is broken
- Ugly error messages in console
- Performance degradation from React attempting recovery

**Warning signs:**
- Console error: "Text content does not match server-rendered HTML"
- `suppressHydrationWarning` used broadly (hiding real bugs)
- Theme flashes on page load
- Specific components stop responding to user input

**Prevention:**
1. **Server Components First:** Default to Server Components; only use `'use client'` for interactivity
2. **Theme Setup:** Initialize theme on server (read from cookie, not localStorage)
3. **Async Values:** Use `useEffect` for client-only content that differs from server render
4. **Dynamic Imports:** Use `dynamic()` with `ssr: false` for client-only components
5. **Boundaries:** Never pass functions or DOM refs across Server/Client boundary
6. **Testing:** Render components in test with server-side context to catch mismatches
7. **suppressHydrationWarning:** Only for known, intentional mismatches (very rare)

**Phase mapping:**
- **Phase 2 (Architecture):** Design Server/Client boundaries with theme system
- **Phase 5 (Testing):** Integration tests catching hydration mismatches

**References:**
- [Next.js Hydration Errors in 2026: The Real Causes, Fixes, and Prevention Checklist](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702)

---

### Pitfall 7: Environment Variables Leaking Secrets

**What goes wrong:**
API keys, database passwords, Stripe secrets end up in:
- Browser bundle (used `NEXT_PUBLIC_` for secret keys)
- `.env` file committed to git
- Error logs and monitoring (Sentry, DataDog)
- Build artifacts

**Why it happens:**
- `NEXT_PUBLIC_` prefix not understood (exposes variables to client)
- `.env` added to `.gitignore` too late—already committed
- Entire config object passed to Client Component (includes secrets)
- Logging catches error with full env object
- Build-time vs runtime variables confusion (env read at build time gets baked in)

**Consequences:**
- API key compromise—attacker calls Stripe, queries database
- Account takeover via leaked secrets
- Data breach via database password exposure

**Warning signs:**
- API keys in browser DevTools (Network tab, localStorage)
- `.env` file in git history
- Client Components importing `process.env` directly
- Error logs showing full environment object
- API rate limiting from unexpected origins

**Prevention:**
1. **Separate Secrets:** Split `env.public.ts` (publishable) and `env.server.ts` (secret-only)
2. **Never NEXT_PUBLIC for Secrets:** Publishable keys only for Stripe public key, Mapbox token, etc.
3. **Data Access Layer:** Only the DAL accesses `process.env.SECRET_*`; other code gets safe objects
4. **Import Guards:** Use `'server-only'` in env.server.ts; prevent Client Components from importing
5. **.gitignore:** Add `.env*.local` immediately; verify no .env in git history
6. **Env Validation:** Runtime validation of required variables (schema with Zod)
7. **Error Handling:** Never log raw env objects; log only safe, non-sensitive context
8. **Build Warnings:** Configure build to warn if `process.env` used in Client Components

**Phase mapping:**
- **Phase 1 (Setup):** Configure env.public.ts and env.server.ts with guards
- **Phase 1 (Setup):** Verify .env.* not in git history
- **Phase 3 (Auth):** Route handlers for secret operations only

**References:**
- [Next.js Environment Variables (2026): Build-Time vs Runtime, Security, and Production Patterns](https://thelinuxcode.com/nextjs-environment-variables-2026-build-time-vs-runtime-security-and-production-patterns/)
- [How to Deploy a Next.js App with Environment Variables (Common Mistakes Explained)](https://meetpan1048.medium.com/how-to-deploy-a-next-js-app-with-environment-variables-common-mistakes-explained-59e52aadd7e0)

---

### Pitfall 8: Database Schema Drift (Prisma) or Connection Pool Exhaustion

**What goes wrong:**

**Prisma variant:**
- Schema file and code disagree on data model
- Migration applied to production; code references old columns
- Hot reload during development creates new Prisma Client instances, exhausting connection pool

**Connection Pool variant:**
- "Too many connections" error in production
- Connections hang after transactions
- Development environment works; production fails

**Why it happens:**
- Prisma doesn't enforce schema as source of truth at runtime
- Developers skip migrations or apply them incorrectly
- Hot reload (common in Next.js dev) creates new clients without cleanup
- Connection pool not configured for serverless (Vercel, Lambda)
- Session pooling not used (connection pooling assumed)

**Consequences:**
- Runtime errors when accessing fields that don't exist
- Production outages from connection exhaustion
- Cascading failures as more requests queue for connections
- Complete database unavailability

**Warning signs:**
- Type errors accessing `.field` that doesn't exist
- "Too many connections" error after deployment
- Prisma Client warnings during development
- Database connection limits hit despite low traffic
- Connection pool warnings in logs

**Prevention:**
1. **Prisma Setup:** Use singleton pattern with `globalThis` for Prisma Client (prevent hot reload instances)
2. **Schema as Truth:** Keep Prisma schema and code in sync; no manual SQL changes
3. **Migration Discipline:** Review every migration before applying; test in staging first
4. **Serverless Pooling:** Use PgBouncer or similar for serverless (Vercel); configure session pooling
5. **Connection Limits:** Set max connections appropriately for environment (10-20 for serverless)
6. **Testing:** E2E tests that create/destroy many connections (catch exhaustion bugs)
7. **Monitoring:** Track active connections, pool wait times; alert on exhaustion

**Phase mapping:**
- **Phase 1 (Setup):** Configure Prisma singleton, serverless pooling
- **Phase 4 (Database):** Schema design and migration strategy
- **Phase 5 (Testing):** Load tests catching connection exhaustion

**References:**
- [Prisma vs Drizzle ORM in 2026 — What You Really Need to Know](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [Stop Using Prisma? Why I Switched to Drizzle ORM in Next.js](https://medium.com/@ashishmehtawork108/stop-using-prisma-why-i-switched-to-drizzle-orm-in-next-js-with-postgresql-setup-guide-62b200df8d81)

---

### Pitfall 9: Boilerplate Too Bloated—Hard to Remove Features

**What goes wrong:**
Boilerplate includes Storybook, Sentry, E2E testing, i18n, multi-tenancy, admin panels. Developer needs simple SaaS with auth and Stripe. Removing features breaks dependencies—Sentry used in error handler, i18n wired into middleware, testing setup intertwined with app code.

**Why it happens:**
- Boilerplate designed to showcase "best practices" (all of them at once)
- Dependencies scattered throughout codebase (hard to isolate)
- No clear feature flags or modular structure
- Marketing promises "production-ready, fully featured"

**Consequences:**
- Developers fork boilerplate to simplify (kills reuse value)
- Unused code bloats bundle size
- Slow builds from unnecessary tooling (Storybook, Sentry)
- Confusion about what's required vs optional
- High startup complexity—"why is all this here?"

**Warning signs:**
- Boilerplate README longer than 500 words listing features
- Removing a dependency breaks multiple parts of app
- Many commented-out imports/components
- Config files for tools the developer won't use
- Build time 2+ minutes locally

**Prevention:**
1. **Minimalist Core:** Ship with only essential features (auth, database, Stripe basics)
2. **Optional Layers:** Sentry, Storybook, i18n as optional, isolated add-ons
3. **Feature Flags:** Environment variables to enable/disable optional features
4. **Modular Structure:** Each feature in separate folder with clear entry points
5. **README:** Simple, < 200 words; link to detailed docs
6. **Removal Guide:** Document how to remove each optional feature
7. **Template Variants:** Offer "minimal" and "full-featured" templates
8. **Zero Config:** If removing something, app still works (no leftover imports)

**Phase mapping:**
- **Phase 1 (Setup):** Design core features vs optional
- **Phase 2 (Architecture):** Implement feature flag system
- **Phase 8+ (Documentation):** Write removal guides

**References:**
- [8 Best NextJS Boilerplates for Developers (2025)](https://snappify.com/blog/nextjs-boilerplates)

---

## Moderate Severity Pitfalls

Mistakes that cause delays, technical debt, or poor developer experience.

### Pitfall 10: TypeScript Strict Mode Disabled—Silent Type Errors

**What goes wrong:**
Boilerplate ships with `strict: false` or doesn't set it. Developers write `param.length` without checking if `param` is null. Works in dev, crashes in production.

**Why it happens:**
- Strict mode is off by default in Next.js
- Early versions of boilerplate didn't enforce it
- Developers don't realize existing code is lenient
- Gradual adoption requires enabling strict mode on per-file basis (painful)

**Consequences:**
- Runtime crashes from null/undefined errors
- Type safety disappears—defeats purpose of TypeScript
- Difficult debugging (error happens far from cause)
- False confidence in type checking

**Warning signs:**
- `tsconfig.json` has `"strict": false`
- No compiler errors on accessing properties of possibly-undefined values
- IDE doesn't highlight type errors
- Many `any` types in codebase

**Prevention:**
1. **Strict from Day 1:** Enable `"strict": true` in tsconfig.json
2. **No any:** Ban `any` type; use `unknown` with type guards
3. **Optional Chaining:** Use `?.` and `??` for null-safe access
4. **Type Guards:** Explicit checks before accessing properties
5. **Linting:** ESLint rules that catch missing null checks
6. **IDE Config:** Share VSCode settings that enforce strict mode in editor

**Phase mapping:**
- **Phase 1 (Setup):** Enable strict mode; configure linting
- **Phase 2 (Architecture):** Review existing code for type errors

**References:**
- [Avoiding Mistakes in Next.js using the TypeScript Plugin](https://dev.to/franciscomoretti/avoiding-mistakes-in-nextjs-using-the-typescript-plugin-4b5h)

---

### Pitfall 11: Race Conditions from Async Import and Concurrent Requests

**What goes wrong:**
Initialization code uses `await import()` without top-level await. Race condition between client-side code and async module initialization. Some requests ignored or crash.

**Why it happens:**
- Dynamic imports (`import()`) are async but developers don't await them
- Concurrent requests arrive before initialization finishes
- State shared between requests without synchronization
- CVE-2025-59466 in Node.js (fixed Jan 2026): stack overflow from deep recursion + async_hooks

**Consequences:**
- Intermittent failures (hard to debug—works sometimes, fails others)
- Requests lost or 500 errors
- Production outages
- Application crashes (Node.js stack overflow)

**Warning signs:**
- Intermittent "module not found" or undefined errors
- Errors only under load (concurrent requests)
- Specific requests fail while others succeed
- Server crashes with no clear cause
- Timing-dependent behavior

**Prevention:**
1. **Top-Level Await:** Use top-level await in modules that initialize state
2. **Locking:** For shared initialization, use a lock to ensure single execution
3. **Testing:** Load tests with concurrent requests to catch race conditions
4. **Node.js Version:** Update to Node.js 20.13+ or later for CVE-2025-59466 fix
5. **Logging:** Log initialization start and completion; catch timing issues early
6. **Async Context:** Use AsyncLocalStorage to prevent context leaks across requests

**Phase mapping:**
- **Phase 1 (Setup):** Configure Node.js version; update dependencies
- **Phase 2 (Architecture):** Design initialization pattern (top-level await or locking)
- **Phase 5 (Testing):** Load tests with concurrent requests

**References:**
- [Beyond Async/Await: Why Your 2026 Apps Still Have Race Conditions](https://javascript.plainenglish.io/beyond-async-await-why-your-2026-apps-still-have-race-conditions-dc43af7437dd)
- [Node.js — Mitigating Denial-of-Service Vulnerability from Unrecoverable Stack Space Exhaustion](https://nodejs.org/en/blog/vulnerability/january-2026-dos-mitigation-async-hooks)

---

### Pitfall 12: Form Validation Skipped on Server Side

**What goes wrong:**
Boilerplate validates forms only on client (JavaScript). Attacker bypasses validation, sends malformed data. Server assumes data is valid (no checks), processes it, corrupts database or crashes.

**Why it happens:**
- Client-side validation feels sufficient
- Server validation seen as "duplicate work"
- Lazy dev assumes Zod/schema on client is enough
- No server-side validation pattern in boilerplate

**Consequences:**
- Data corruption (invalid states in database)
- Business logic bypassed (e.g., prices sent by client, not fetched from server)
- Crashes from unexpected data types
- Security vulnerability (attacker bypasses business rules)

**Warning signs:**
- Server route handlers accept data without validation
- Only client-side Zod schemas, no server-side
- No error responses for invalid data (assumes success)
- Database constraints missing (rely on application validation)
- Sending prices/sensitive values from client

**Prevention:**
1. **Always Validate:** Every server endpoint validates inputs, even if client did
2. **Dual Validation:** Zod schema on both client and server (separate, not shared)
3. **Server as Source of Truth:** Prices, permissions, sensitive values fetched from server, not sent by client
4. **Error Responses:** Return detailed validation errors from server (helps debugging)
5. **Database Constraints:** Add constraints (NOT NULL, CHECK, UNIQUE) to catch app bugs
6. **Logging:** Log validation failures for suspicious patterns

**Phase mapping:**
- **Phase 4 (API):** Implement server-side validation pattern
- **Phase 4 (Payments):** Never trust prices from client; fetch from server/Stripe

**References:**
- [Handling Forms in Next.js with next/form, Server Actions, useActionState, and Zod Validation](https://medium.com/@sorayacantos/handling-forms-in-next-js-with-next-form-server-actions-useactionstate-and-zod-validation-15f9932b0a9e)

---

### Pitfall 13: Tailwind CSS Classes Missing in Production

**What goes wrong:**
Dark mode toggle works in dev, breaks in production. Grid layout disappears. CSS classes removed by PurgeCSS because they're generated dynamically.

**Why it happens:**
- Dynamic class strings: `className={theme === 'dark' ? 'dark' : 'light'}` (fine)
- Broken dynamic strings: `className={`${prefix}-button`}` or `className={\`text-\${color}\`}` (PurgeCSS removes them)
- Tailwind config doesn't scan all template files
- Classes generated at runtime not visible to PurgeCSS at build time

**Consequences:**
- Missing styles in production
- Broken layouts, unreadable text
- Hard to debug (works locally)
- User-facing UX problems

**Warning signs:**
- Styles work locally, break after build
- Specific themes or variants missing in production
- PurgeCSS warnings during build
- Dynamic class generation via string templates

**Prevention:**
1. **Static Classes:** Use ternaries for class selection, not template literals
   - Good: `className={isDark ? 'dark' : 'light'}`
   - Bad: `className={\`text-\${color}\`}`
2. **Safelist:** Add rarely-used classes to `safelist` in tailwind.config.ts
3. **Content Glob:** Ensure `content` in tailwind.config includes all template files (app/**, components/**)
4. **Testing:** Build locally and inspect class names in DevTools
5. **tailwind-merge:** Use `clsx` + `twMerge` for conditional class merging without conflicts

**Phase mapping:**
- **Phase 2 (Styling):** Configure Tailwind with correct content glob
- **Phase 5 (Testing):** Verify styles in production-like build

**References:**
- [Why are CSS classes missing in production when using Tailwind and Next.js?](https://www.geeksforgeeks.org/nextjs/why-are-css-classes-missing-in-production-when-using-tailwind-and-next-js/)

---

### Pitfall 14: Vercel Cold Starts and Bundle Bloat

**What goes wrong:**
First request to your app takes 3+ seconds. Cold start latency. User thinks site is dead.

**Why it happens:**
- Large dependencies (Sentry, @anthropic-sdk, AI libraries)
- Boilerplate includes everything, not optimized for size
- Node.js startup time + module parsing (especially with many dependencies)
- Function size > 50MB (Vercel limit)

**Consequences:**
- Poor perceived performance
- Users abandon site
- SEO penalty for slow TTFB
- Production requests timeout

**Warning signs:**
- Local build output > 100MB
- Vercel logs show 2+ second initialization
- Bundle analysis shows unused dependencies
- Large node_modules (> 200MB)

**Prevention:**
1. **Bundle Analysis:** Use `next/bundle-analyzer` to identify large deps
2. **Lazy Loading:** Dynamic imports for heavy libraries (analytics, date pickers)
3. **Minimal Core:** Ship only essential dependencies; optional features as separate imports
4. **Compression:** Enable gzip/brotli; ensure build is optimized
5. **Dependency Audit:** Remove unused packages (`npx depcheck`)
6. **Testing:** Monitor bundle size in CI; alert on increases > 50KB
7. **Caching:** Configure Cache-Control headers for static assets

**Phase mapping:**
- **Phase 1 (Setup):** Configure bundle analyzer
- **Phase 5 (Performance):** Optimize dependencies, lazy loading
- **Phase 6 (Monitoring):** Track bundle size trends

**References:**
- [How can I improve function cold start performance on Vercel?](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel)
- [Kill Bundle Bloat in Next.js: 9 Practical Ways to Drop 100 KB Today](https://medium.com/@sureshdotariya/kill-bundle-bloat-in-next-js-9-practical-ways-to-drop-100-kb-today-3dd7afe1ac87)

---

## Minor/Low Severity Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 15: React 19 + React Compiler Compatibility Issues

**What goes wrong:**
Boilerplate uses older third-party libraries incompatible with React 19. Build fails or runtime errors. Common with next-auth v4, older UI libraries.

**Why it happens:**
- React 19 introduced breaking changes
- Third-party libraries slow to update
- Boilerplate uses latest React but dependencies lag
- Compiler experimental; edge cases not covered

**Consequences:**
- Build errors preventing deployment
- Need to downgrade React or wait for library updates
- Type errors with client libraries

**Warning signs:**
- Build error mentioning "React 19" or "use client"
- Compatibility warnings for installed packages
- Next.js 15.3.1+ needed for React Compiler stability

**Prevention:**
1. **Version Compatibility Matrix:** Document which versions of libraries work with React 19
2. **Testing:** Test with latest React/Compiler on each update
3. **Upgrade Guide:** Provide path for users to handle incompatibilities
4. **Community Discussion:** Link to known issues for popular libraries

**Phase mapping:**
- **Phase 1 (Setup):** Document React 19 compatibility
- **Phase 5 (Testing):** Automated testing with React Compiler enabled

**References:**
- [React 19.2 + React Compiler RC in Next.js 15.5](https://glitchedgoblet.blog/post/react-19)
- [Next.js 15 + React 19 - shadcn/ui](https://ui.shadcn.com/docs/react-19)

---

### Pitfall 16: File Upload Security—No Size/Type Validation

**What goes wrong:**
User uploads 10GB file; server crashes. Attacker uploads executable; you serve it back. No checks on file type or size.

**Why it happens:**
- File upload code focuses on functionality, skips validation
- Size limits seem "unnecessary"
- Type checking assumed from extension (unreliable)
- No security review of upload flow

**Consequences:**
- Server crashes from large uploads
- Disk space exhaustion
- Malware distribution
- Bandwidth waste

**Warning signs:**
- Upload endpoint accepts any file size
- No MIME type validation
- Files stored with original names (executable risk)
- No virus scanning or external storage

**Prevention:**
1. **Size Limits:** Set reasonable limits (5-100MB depending on use case)
2. **MIME Type Validation:** Check `Content-Type` and file magic bytes
3. **External Storage:** Use Cloudinary, Uploadcare, or S3 (not local disk)
4. **Rename Files:** Generate UUIDs for uploaded files; strip original names
5. **Virus Scanning:** For untrusted uploads, scan with VirusTotal or similar
6. **Rate Limiting:** Limit uploads per user to prevent abuse

**Phase mapping:**
- **Phase 4 (Media):** Implement file upload with size/type validation
- **Phase 4 (Media):** Configure external storage (S3, Cloudinary)

**References:**
- [Handling File Uploads in Nextjs Best Practices and Security Considerations](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)

---

## Phase-Specific Pitfall Mapping

| Phase | Topics | Critical Pitfalls | Prevention |
|-------|--------|-------------------|-----------|
| **1: Setup** | Config, dependencies, env vars | Outdated stack, env leaks | Renovate, strict .env validation, no-any rule |
| **2: Architecture** | Structure, layout, styling | Boilerplate bloat, CSS purging, Server/Client boundaries | Modular design, feature flags, Tailwind content glob |
| **3: Auth** | Sessions, middleware, protection | Auth bypass, session persistence, NextAuth secrets | JWT edge strategy, secret management, env parity testing |
| **4: API** | Routes, validation, Server Actions | Server Action RCE, form validation skipped, Stripe webhook bypass | Input validation, signature verification, error handling |
| **5: Database** | Schema, ORM, migrations, pooling | Multi-tenant data bleed, connection pool exhaustion, schema drift | Defense-in-depth isolation, connection pooling, singleton Prisma |
| **5: Testing** | Unit, integration, e2e | Hydration mismatches, async race conditions | Comprehensive test coverage, load testing, environment parity |
| **6: Monitoring** | Logging, errors, performance | Cold starts, missing CSS in production | Bundle analysis, performance monitoring, error tracking |

---

## Open Questions for Phase-Specific Research

- **Phase 3 (Auth):** Detailed evaluation of Auth.js v5 vs Better Auth vs Clerk for new boilerplates
- **Phase 4 (Payments):** Should boilerplate include pre-built billing portal UI or minimal example?
- **Phase 5 (Database):** Prisma vs Drizzle decision—what's the right choice for 2026 boilerplate?
- **Phase 6 (Deployment):** Document common Vercel configuration mistakes and optimal settings
- **Phase 8+ (Docs):** Should boilerplate maintain migration guides for users from old versions?

---

## Summary

The most critical gaps when building a Next.js SaaS boilerplate are:

1. **Multi-tenant isolation** must be architected from the start (not added later)
2. **Auth security** requires attention to middleware limits, session persistence, and error cases
3. **Server Actions** treated as private is dangerous—treat them as public API endpoints
4. **Dependency management** needs automation (Renovate) to avoid becoming outdated
5. **Modular design** prevents bloat from defeating the purpose of a boilerplate
6. **Environment variables** need separated secrets and guards to prevent leaks
7. **Testing strategy** must cover hydration, async edge cases, and multi-tenant isolation

**Recommendation:** Build with security and modularity first; feature-richness second. A minimal boilerplate that's secure, well-documented, and easy to extend will gain more users than a bloated one with every possible feature.
