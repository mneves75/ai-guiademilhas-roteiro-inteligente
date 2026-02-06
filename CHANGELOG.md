# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-database Drizzle client with `DB_PROVIDER` support: `postgres` (default), `sqlite`, `d1`
- Database tooling
  - Provider-specific drizzle-kit configs for Postgres/SQLite/D1
  - Multi-provider seed script plus a Drizzle-based seed assertion (`pnpm db:assert-seed`)
- Playwright E2E tests and CI-friendly `webServer` configuration
- Landing page refactor: home page split into explicit components under `src/components/landing/`
- shadcn-style UI primitives for the landing page (`Accordion`, `Sheet`)
- Nightly scheduled workflow to run the full Playwright browser matrix (`PW_FULL=1`)
- Engineering sign-off and multi-DB first-principles critique docs

### Changed

- Upgraded to Next.js 16.1.6 (from 15.x)
- Upgraded @typescript-eslint packages to v8 for ESLint 9 compatibility
- Updated eslint-config-next and @next/eslint-plugin-next to v16
- Tailwind CSS v4 PostCSS setup and globals configuration
- Type-check now runs `next typegen` before `tsc` to keep typed routes consistent
- CI updated to use pnpm 10 (lockfile v9 compatibility) and reproducible installs
- Better Auth initialization is now lazy (`getAuth()`) to avoid build-time env evaluation

### Fixed

- Prevented build-time crashes from missing Stripe env by initializing Stripe at runtime call sites
- Fixed auth/env handling and reduced build-time failures by failing fast with clear messages
- Prevented `pnpm build` from failing due to auth env checks by forcing authenticated layouts to be dynamic
- Wrapped `useSearchParams()` usage behind `Suspense` to avoid CSR bailout warnings on prerender
- Middleware route allowlist updated for public blog and required anonymous APIs (webhooks, auth, OG, invites)
- Playwright E2E stability: port handling, baseURL-derived webServer port, and route path fixes (`/signup`)
- Landing header now exposes an accessible primary navigation landmark (`aria-label="Primary"`)
- Removed raw Drizzle `sql`...` usage in admin queries to keep cross-dialect portability

## [0.1.0] - 2026-02-05

### Added

- Initial project setup
- Phase 1 planning and research documentation
- Project roadmap with 12 phases covering 90 requirements
- Phase 1: Foundation & Code Quality complete
  - TypeScript strict mode enabled
  - ESLint 9 flat config with Next.js + React rules
  - Prettier formatting configuration
  - Husky pre-commit hooks with lint-staged
  - GitHub Actions CI/CD workflows (lint, type-check, test)
  - Developer documentation (DEVELOPMENT.md)
  - Environment variables template (.env.example)
- Infrastructure
  - Next.js App Router scaffold
  - pnpm as package manager
  - GitHub repository with best practices docs

[Unreleased]: https://github.com/mneves75/nextjs-bootstrapped-shipped/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mneves75/nextjs-bootstrapped-shipped/releases/tag/v0.1.0
