# Development Guide

## Getting Started

### Clone and Setup

```bash
git clone https://github.com/[org]/nextjs-bootstrapped-shipped.git
cd nextjs-bootstrapped-shipped
pnpm install        # Installs dependencies + Husky hooks
pnpm dev            # Starts development server
```

Navigate to http://localhost:3000. Development server should start without errors.

### Code Quality

We enforce code quality at three levels: local, pre-commit, and CI/CD.

#### Local Development

Check code quality while developing:

```bash
pnpm lint            # Run ESLint on all files
pnpm lint:fix        # Auto-fix ESLint violations
pnpm type-check      # Run TypeScript type checker
pnpm format          # Format code with Prettier
pnpm format:check    # Check if code is formatted
```

Run before committing:

```bash
pnpm lint && pnpm type-check && pnpm format
```

#### Pre-Commit Hook

When you run `git commit`, Husky automatically:

1. Runs ESLint on changed files (with --fix for auto-corrections)
2. Runs Prettier on changed files
3. Blocks commit if violations remain

You can't accidentally commit bad code.

#### GitHub Actions CI/CD

On every PR and push to main/develop:

1. **Lint workflow**: Runs `pnpm lint` (no warnings allowed)
2. **Type-check workflow**: Runs `pnpm type-check`
3. **Test workflow**: Runs `pnpm test` against PostgreSQL

All three must pass before merge is allowed.

#### Vercel Preview

On every PR, Vercel automatically:

1. Builds the project
2. Deploys to a preview URL
3. Posts preview link in PR comments

Test feature changes in the preview before approving.

### Bypassing Hooks (Emergency Only)

If you absolutely must bypass pre-commit hook (not recommended):

```bash
git commit --no-verify
```

But do NOT do this unless necessary. Commits will likely fail CI/CD.

### Environment Variables

Copy .env.example to .env.local and fill in values:

```bash
cp .env.example .env.local
```

Edit .env.local (never commit this file):

- DATABASE_URL: PostgreSQL connection string
- DB_PROVIDER: `postgres` (default) | `sqlite` | `d1`
- SQLITE_PATH: SQLite file path (only when `DB_PROVIDER=sqlite`)
- NEXT_PUBLIC_APP_URL: http://localhost:3000 (for development)
- API keys: Stripe, Resend, etc.

### Database Workflows

Postgres:

```bash
pnpm db:push:pg
pnpm db:seed
```

SQLite:

```bash
DB_PROVIDER=sqlite SQLITE_PATH=./data/app.db pnpm db:push
DB_PROVIDER=sqlite SQLITE_PATH=./data/app.db pnpm db:seed
```

Cloudflare D1:

```bash
# Migrations (requires CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_DATABASE_ID / CLOUDFLARE_D1_TOKEN)
DB_PROVIDER=d1 pnpm db:push

# Seed (Worker runtime): use Wrangler
wrangler d1 execute app-db --local --file=src/db/seed.d1.sql
```

### Troubleshooting

**Pre-commit hook runs but ESLint fails**

- Hook automatically fixes some issues (indentation, quotes, semicolons)
- Read error message and fix remaining violations manually
- Try: `pnpm lint:fix` to auto-fix, then commit again

**Husky hook not running after clone**

- Run: `pnpm install` (should install hooks automatically via prepare script)
- If still not working: `pnpm exec husky`

**Type-check fails locally but passes in CI**

- You may have stale build artifacts: `rm -rf .next && pnpm type-check`

**Vercel preview not deploying**

- Check GitHub Settings → Installed GitHub Apps → Vercel is enabled
- Push a new commit to trigger build

### Running Tests

Tests are configured in Phase 12. For now:

```bash
pnpm test          # Will show no test files (expected)
```

Tests will be added as features are built.

## Code Style Guidelines

- **TypeScript strict mode**: All files use strict type checking
- **No `any` types**: Use `unknown` + type guards instead
- **Prettier formatting**: 100 char line width, single quotes, 2-space indent
- **File organization**: Colocate components with tests
- **Naming**: camelCase for variables/functions, PascalCase for components/types

See CLAUDE.md for additional guidelines when using Claude for code generation.
