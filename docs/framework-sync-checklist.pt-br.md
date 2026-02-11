# Checklist de Sync com Upstream (Core x Dominio)

Atualizado: 2026-02-11

## 1) Preparacao (antes do merge)

- [ ] Rodar `pnpm framework:bootstrap`
- [ ] Rodar `FRAMEWORK_DOCTOR_STRICT=1 pnpm framework:doctor`
- [ ] Rodar `pnpm framework:preview` para inspecionar commits e arquivos impactados

## 2) Resolucao de conflitos por fronteira

### 2.1 Core reutilizado (priorizar upstream)

- [ ] `proxy.ts`
- [ ] `scripts/**`
- [ ] `observability/**`
- [ ] workflows de CI em `.github/workflows/**` (exceto customizacoes de negocio)

### 2.2 Dominio Guia de Milhas (priorizar produto)

- [ ] `app/page.tsx`
- [ ] `src/content/landing.ts`
- [ ] `src/lib/planner/**`
- [ ] `app/(protected)/dashboard/planner/**`

### 2.3 Arquivos compartilhados (revisao manual obrigatoria)

- [ ] `README.md`
- [ ] `CHANGELOG.md`
- [ ] `test_plan.md`
- [ ] `progress.md`

## 3) Validacao obrigatoria (apos merge)

- [ ] Rodar `pnpm framework:check` com `FRAMEWORK_UPSTREAM_MAX_BEHIND=0`
- [ ] Rodar `pnpm verify` (lint + type-check + tests + build + db smoke + e2e:ci)
- [ ] Rodar `pnpm security:audit`
- [ ] Registrar evidencias em `test_plan.md` e `progress.md`

## 4) Governanca remota

- [ ] Abrir/atualizar PR de sync (`chore/upstream-sync`)
- [ ] Confirmar checks obrigatorios verdes no GitHub Actions
- [ ] Confirmar branch protection ativa (`CODEOWNERS` + approvals + status checks)
