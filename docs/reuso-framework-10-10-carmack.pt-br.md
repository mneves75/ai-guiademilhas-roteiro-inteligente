# Reuso de Framework 10/10 (Carmack Review)

Atualizado: 2026-02-11

## Problema (primeiros principios)

Manter um produto derivado de framework sem degradar:

1. **Correcao**: sincronizar upstream sem quebrar dominio.
2. **Velocidade**: reduzir custo recorrente de merge/conflito.
3. **Auditabilidade**: saber quando estamos atras do upstream e quem aprova mudancas.
4. **Reprodutibilidade**: qualquer engenheiro consegue repetir o processo com comandos deterministas.

## Abordagem de mercado (fontes primarias)

1. **Fork/derivado com upstream sincronizado**: fluxo oficial de sync de forks.  
   Fonte: GitHub Docs - Syncing a fork.
2. **Ownership por caminho + branch protection**: revisao obrigatoria em areas criticas.  
   Fontes: CODEOWNERS + Protected Branches (GitHub Docs).
3. **Automacao agendada de verificacao**: detectar drift continuamente em CI.  
   Fonte: GitHub Actions `schedule`.
4. **Reducao de custo de conflito repetido**: `git rerere` para reaplicar resolucoes.  
   Fonte: Git `rerere`.
5. **Fronteiras claras de migracao**: estrategia de estrangulamento para evolucao segura.  
   Fonte: Martin Fowler (Strangler Fig).

## Solucao elegante implementada

### Operacao local

- `pnpm framework:bootstrap`
  - inicializa Git (se necessario)
  - configura/atualiza remote `upstream`
  - habilita `git rerere` automaticamente
- `pnpm framework:status`
  - mostra `ahead/behind`
- `pnpm framework:preview`
  - lista commits/arquivos que entrariam no proximo sync (sem mutacao)
- `pnpm framework:check`
  - gate de drift (`behind <= FRAMEWORK_UPSTREAM_MAX_BEHIND`)
- `pnpm framework:doctor`
  - diagnostico objetivo de prontidao de governanca:
    - `upstream` funcional
    - `origin` configurado
    - `CODEOWNERS` presente
    - branch protection (status checks + code owner reviews + approvals) quando `origin` e GitHub com `gh` autenticado
- `pnpm framework:sync`
  - merge do upstream com precondicoes de integridade
- `pnpm framework:sync:verify`
  - sync + gate completo (`pnpm verify`)

### Governanca

- Workflow diario/manual de drift: `.github/workflows/upstream-drift.yml`
- Workflow semanal/manual de sync por PR: `.github/workflows/upstream-sync-pr.yml`
- Ownership por caminho: `.github/CODEOWNERS`
- Documentacao operacional atualizada:
  - `README.md`
  - `docs/reuso-framework-upstream.pt-br.md`

## Critica da versao anterior (e por que isso ficou melhor)

- **Antes**: havia sync e verify, mas faltava visibilidade pre-merge (`preview`).
- **Antes**: havia controle de drift, mas faltava ownership formal versionado.
- **Antes**: conflitos recorrentes dependiam totalmente de memoria humana.
- **Agora**:
  - preflight explicito (`preview`)
  - ownership explicito (`CODEOWNERS`)
  - aprendizado de merge automatizado (`rerere`)
  - drift gate automatizado em CI

## O que falta para 10/10 absoluto

1. Conectar `origin` neste workspace local para push/PR automatizavel fim-a-fim.
2. Rodar `FRAMEWORK_DOCTOR_STRICT=1 pnpm framework:doctor` em ambiente com `gh` autenticado e permissao de leitura no repo remoto para validar branch protection real.
3. Opcional: endurecer workflow semanal para executar `pnpm verify` completo no job de abertura de PR.

## Fontes

- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork
- https://git-scm.com/docs/git-rerere
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule
- https://martinfowler.com/bliki/StranglerFigApplication.html
