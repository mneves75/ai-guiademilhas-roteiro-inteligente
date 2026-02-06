# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router routes, layouts, and route groups like `(auth)` and `(protected)`.
- `src/`: Shared code: `components/`, `lib/`, `contexts/`, `db/` (Drizzle schema + queries), `emails/`.
- `content/blog/`: MDX blog posts with frontmatter.
- `public/`: Static assets (e.g., `public/manifest.json`).
- `e2e/`: Playwright end-to-end tests (`*.spec.ts`).
- `src/lib/__tests__/`: Vitest unit tests (`*.test.ts`).

## Build, Test, and Development Commands

Use `pnpm` (preferred by repo docs and lockfile).

- `pnpm dev`: Run the local dev server at `http://localhost:3000`.
- `pnpm build`: Production build.
- `pnpm start`: Start the production server.
- `pnpm lint`: ESLint (zero warnings allowed).
- `pnpm type-check`: TypeScript strict mode check.
- `pnpm format`: Prettier format all files.
- `pnpm test`: Vitest unit tests.
- `pnpm test:e2e`: Playwright E2E tests.
- `pnpm db:push` / `pnpm db:migrate`: Drizzle schema sync and migrations.

## Coding Style & Naming Conventions

- TypeScript strict mode; avoid `any` (ESLint rule enforced).
- Prettier rules: 2-space indent, single quotes, semicolons, 100-char line width.
- Naming: `camelCase` for variables/functions, `PascalCase` for components/types.
- Prefer Server Components; use `'use client'` only when needed.
- Use `@/` path alias for `src/` imports.

## Testing Guidelines

- Unit tests: Vitest in `src/lib/__tests__/*.test.ts`. Run with `pnpm test` or `pnpm test:watch`.
- E2E tests: Playwright in `e2e/*.spec.ts`. Run with `pnpm test:e2e` or `pnpm test:e2e:ui`.
- Keep tests close to the code they validate; add tests for new features and regressions.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits, as seen in history: `feat(blog): add MDX blog system`.
- PR titles use the same format.
- Fill out the PR template in `.github/pull_request_template.md`, including testing and screenshots when UI changes are involved.
- Ensure `pnpm lint`, `pnpm type-check`, and tests pass before requesting review.

## Environment & Configuration

- Copy `.env.example` to `.env.local` and set required values:
  - `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and third-party API keys (Stripe, Resend, etc.).
- Never commit `.env.local`. See `SECURITY.md` for reporting vulnerabilities.
