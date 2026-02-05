# NextJS Bootstrapped Shipped

A modern, full-featured Next.js 15 boilerplate for shipping production apps fast. Not just scaffolding—a working foundation with auth, quality tooling, and all the patterns you need.

## Features

- **Next.js 16** + React 19 + TypeScript (strict mode)
- **Better Auth** - Modern authentication (coming soon)
- **PostgreSQL + Drizzle ORM** - Type-safe database (coming soon)
- **Stripe Integration** - Payments & subscriptions (coming soon)
- **Geist Design System** - Vercel's design system + shadcn/ui (coming soon)
- **Email System** - Resend + React Email (coming soon)
- **Full CI/CD** - GitHub Actions + Vercel previews

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mneves75/nextjs-bootstrapped-shipped.git
cd nextjs-bootstrapped-shipped

# Install dependencies (uses pnpm)
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

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

## Project Status

| Phase                        | Status      | Description                  |
| ---------------------------- | ----------- | ---------------------------- |
| 1. Foundation & Code Quality | ✅ Complete | TypeScript, ESLint, CI/CD    |
| 2. Database & Schema         | 🔜 Next     | PostgreSQL, Drizzle ORM      |
| 3. Authentication            | ⏳ Planned  | Better Auth integration      |
| 4-12. Features               | ⏳ Planned  | Teams, Payments, Admin, etc. |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) first.

## Security

Found a vulnerability? Please report it responsibly. See [SECURITY.md](./SECURITY.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with [Claude Code](https://claude.ai/code) by [@mneves75](https://github.com/mneves75)
