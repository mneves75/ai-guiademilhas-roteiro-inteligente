# NextJS Bootstrapped Shipped

A modern, full-featured Next.js 16 boilerplate for shipping production apps fast. Not just scaffolding: a working demo app with auth, teams, billing, admin, blog, and production checks.

## Features

- **Next.js 16** + React 19 + TypeScript (strict mode)
- **Better Auth** - Email/password, OAuth (Google/GitHub), password reset, magic link
- **PostgreSQL / SQLite / D1 + Drizzle ORM** - Type-safe database (multi-provider)
- **Multi-tenancy** - Workspaces, members, invitations, roles
- **Stripe Integration** - Subscriptions (monthly/yearly), one-time payment, portal, idempotent webhooks
- **Admin Dashboard** - User list/details, subscriptions, revenue, impersonation
- **Email System** - Resend + React Email templates + dev preview
- **Geist + shadcn/ui** - Design system and UI primitives
- **I18N** - Cookie-based locale + language switcher (en, pt-BR)
- **Storage** - Avatar uploads with adapters (local, R2, Vercel Blob)
- **Full CI/CD** - GitHub Actions + Vercel previews

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mneves75/nextjs-bootstrapped-shipped.git
cd nextjs-bootstrapped-shipped

# One command local setup (SQLite + seed + dev server)
./init.sh
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Usage

```bash
# Run the full local quality gate (lint, type-check, unit tests, build, DB smoke, E2E)
pnpm verify

# Health checks (useful for Docker / load balancers)
curl -s http://localhost:3000/health
```

## Tech Stack

| Category   | Technology                   |
| ---------- | ---------------------------- |
| Framework  | Next.js 16 (App Router)      |
| Language   | TypeScript 5.9 (strict mode) |
| Styling    | Tailwind CSS + shadcn/ui     |
| Database   | PostgreSQL + Drizzle ORM     |
| Auth       | Better Auth                  |
| Payments   | Stripe                       |
| Email      | Resend + React Email         |
| Testing    | Vitest + Playwright          |
| Deployment | Vercel + Docker              |

## Code Quality

This project enforces code quality at three levels:

1. **Local**: TypeScript strict mode, ESLint 9, Prettier
2. **Pre-commit**: Husky + lint-staged blocks bad commits
3. **CI/CD**: GitHub Actions validates every PR

```bash
pnpm lint          # Run ESLint
pnpm type-check    # Run TypeScript checker
pnpm format        # Format with Prettier
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

## Health

- `GET /health` - liveness probe for load balancers/uptime checks
- `GET /api/health` - same payload (backwards-compatible)

## Project Status

| Phase            | Status      | Description                 |
| ---------------- | ----------- | --------------------------- |
| 1-12. v1 Roadmap | ✅ Complete | End-to-end demo app + gates |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) first.

## Security

Found a vulnerability? Please report it responsibly. See [SECURITY.md](./SECURITY.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with [Claude Code](https://claude.ai/code) by [@mneves75](https://github.com/mneves75)
