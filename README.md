# Guia de Milhas - Roteiro Inteligente

Aplicacao de planejamento de viagens com milhas, baseada no framework Next.js 16 e adaptada para fluxo de decisao com IA no dashboard.

## Features

- **Next.js 16** + React 19 + TypeScript (strict mode)
- **Better Auth** - Email/password, OAuth (Google/GitHub), password reset, magic link
- **PostgreSQL / SQLite / D1 + Drizzle ORM** - Type-safe database (multi-provider)
- **Multi-tenancy** - Workspaces, members, invitations, roles
- **Stripe Integration** - Subscriptions (monthly/yearly), one-time payment, portal, idempotent webhooks
- **Admin Dashboard** - User list/details, subscriptions, revenue, impersonation
- **Email System** - Resend + React Email templates + dev preview
- **Geist + shadcn/ui** - Design system and UI primitives
- **I18N (SEO-safe)** - Locale-prefixed public URLs (`/en/*`, `/pt-br/*`) + cookie preference + language switcher
- **SEO Baseline** - Sitemap, robots, RSS autodiscovery, canonical + `hreflang` alternates enforced
- **Storage** - Avatar uploads with adapters (local, R2, Vercel Blob)
- **Full CI/CD** - GitHub Actions + Vercel previews

## Quick Start

```bash
# Clone the repository
git clone <URL-DO-REPO-DO-PRODUTO>
cd ai-guiademilhas-roteiro-inteligente

# One command local setup (SQLite + seed + dev server)
./init.sh
```

Open [http://localhost:3000](http://localhost:3000) to see your app (redirects to `/en` by default).

## Usage

```bash
# Run the full local quality gate (lint, type-check, unit tests, build, DB smoke, E2E)
pnpm verify

# Bootstrap and monitor framework upstream reuse
pnpm framework:bootstrap
pnpm framework:status

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
Para estrategia de sincronizacao com framework base, veja [docs/reuso-framework-upstream.pt-br.md](./docs/reuso-framework-upstream.pt-br.md).
Checklist operacional de conflitos/sync: [docs/framework-sync-checklist.pt-br.md](./docs/framework-sync-checklist.pt-br.md).
Para critica de primeiros principios e versao 10/10, veja [docs/reuso-framework-10-10-carmack.pt-br.md](./docs/reuso-framework-10-10-carmack.pt-br.md).

## Framework Upstream

- `pnpm framework:bootstrap`: inicializa Git (se necessario) e configura o remote `upstream` do framework base.
- `pnpm framework:status`: mostra branch upstream efetiva e divergencia local.
- `pnpm framework:preview`: mostra commits/arquivos que entrariam no proximo sync, sem mutacao.
- `pnpm framework:check`: falha se o repositorio estiver atras do upstream (controle de drift).
- `pnpm framework:doctor`: diagnostica prontidao de reuso (upstream/origin/CODEOWNERS/branch protection quando possivel).
- `pnpm framework:sync`: aplica merge de `upstream/<branch>`.
- `pnpm framework:sync:verify`: executa sync + `pnpm verify`.

Variaveis uteis:

- `FRAMEWORK_UPSTREAM_SOURCE`: aceita caminho local **ou** URL Git remota do framework.
- `FRAMEWORK_UPSTREAM_PATH`: compat legado para caminho local.
- `FRAMEWORK_UPSTREAM_BRANCH`: branch alvo (autodetecta via `HEAD` quando necessario).
- `FRAMEWORK_UPSTREAM_MAX_BEHIND`: tolerancia de drift usada por `framework:check` (default `0`).
- `FRAMEWORK_DOCTOR_STRICT`: em `1`, warnings do `framework:doctor` tambem quebram o comando.
- `FRAMEWORK_DOCTOR_TARGET_BRANCH`: branch alvo para validar branch protection no `framework:doctor`.
- `FRAMEWORK_UPSTREAM_SOURCE_URL`: repository variable para CI acessar upstream privado com URL autenticada.

`framework:doctor` pode emitir `[LIMIT]` quando o ambiente/repo nao permite validar branch protection (ex.: repo privado sem plano com suporte), sem mascarar falhas locais.

No `bootstrap`, o repositório habilita `git rerere` automaticamente para reduzir custo de resolucao de conflitos recorrentes em merges de upstream.
No CI, o projeto possui:
- deteccao diaria de drift em `.github/workflows/upstream-drift.yml`;
- PR semanal automatica de sync upstream em `.github/workflows/upstream-sync-pr.yml`;
- gate unico de bloqueio para PR/push em `main` (`.github/workflows/governance-gate.yml`) executando `framework:doctor` estrito + `framework:check` + `pnpm verify`.
Quando o upstream for privado e nao acessivel pelo runner, os workflows de upstream emitem warning explicito e mantem o gate de qualidade (`pnpm verify`) ativo.

## Health

- `GET /health` - liveness probe for load balancers/uptime checks
- `GET /api/health` - same payload (backwards-compatible)

## Project Status

| Phase            | Status      | Description                 |
| ---------------- | ----------- | --------------------------- |
| 1-12. v1 Roadmap | ✅ Complete | End-to-end demo app + gates |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) first.

Need help? See [SUPPORT.md](./SUPPORT.md).

## Security

Found a vulnerability? Please report it responsibly. See [SECURITY.md](./SECURITY.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with [Claude Code](https://claude.ai/code) by [@mneves75](https://github.com/mneves75)
