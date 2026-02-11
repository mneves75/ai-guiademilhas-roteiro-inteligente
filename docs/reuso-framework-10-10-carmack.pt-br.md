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

## Critica sem maquiagem (primeiros principios)

1. **Merge de upstream funciona, mas nao e composicao de produto**: ainda acopla evolucao de framework e produto no mesmo repositorio.
2. **Auditabilidade estava boa, mas incompleta**: faltava garantir `strict status checks`, check obrigatorio nominal, `conversation resolution` e `enforce admins`.
3. **Escalabilidade organizacional limitada**: para multiplos produtos, merge de fork tende a crescer custo de conflito.

Conclusao: a base estava forte, mas nao era "10/10 Carmack" sem invariantes adicionais de governanca e sem rota clara para desacoplamento por versao.

## Solucao elegante implementada (versao forte e atualizada)

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
    - em modo estrito, exige tambem:
      - `required_status_checks.strict = true`
      - presenca do check obrigatorio (`FRAMEWORK_DOCTOR_REQUIRED_CHECK`, default `Governance Gate`)
      - `required_conversation_resolution.enabled = true`
      - `enforce_admins.enabled = true`
- `pnpm framework:sync`
  - merge do upstream com precondicoes de integridade
- `pnpm framework:sync:verify`
  - sync + gate completo (`pnpm verify`)

### Governanca

- Workflow diario/manual de drift: `.github/workflows/upstream-drift.yml`
- Workflow semanal/manual de sync por PR: `.github/workflows/upstream-sync-pr.yml`
- Workflow unico de bloqueio em PR/push para `main`: `.github/workflows/governance-gate.yml`
- Ownership por caminho: `.github/CODEOWNERS`
- Documentacao operacional atualizada:
  - `README.md`
  - `docs/reuso-framework-upstream.pt-br.md`

## Critica da versao anterior (e por que isso ficou melhor)

- **Antes**: havia sync e verify, mas faltava visibilidade pre-merge (`preview`).
- **Antes**: havia controle de drift, mas faltava ownership formal versionado.
- **Antes**: conflitos recorrentes dependiam totalmente de memoria humana.
- **Antes**: branch protection podia passar sem garantir invariantes operacionais completos.
- **Agora**:
  - preflight explicito (`preview`)
  - ownership explicito (`CODEOWNERS`)
  - aprendizado de merge automatizado (`rerere`)
  - drift gate automatizado em CI
  - doctor estrito com invariantes de governanca verificaveis

## O que precisa para 10/10 absoluto (e por que)

1. **Invariantes de branch protection como contrato** (ja implementado).
2. **Gates de regressao deterministas em CI** (ja implementado com `verify:ci`).
3. **Fronteira de dominio pequena e explicita** (ja implementado: landing + planner como overlay de produto).
4. **Rota de desacoplamento por versao** (proxima etapa recomendada): extrair o core reutilizavel para pacote versionado (SemVer) e consumir por dependencia, reduzindo custo de conflito entre repositorios.

## Decisao de arquitetura (estado atual vs proximo passo)

- **Agora (escolha pragmatica)**: fork/derivado com upstream sync + gates estritos.
- **Evolucao recomendada (industria para escala)**:
  - converter o core do framework em pacote(s) versionado(s);
  - manter o app de produto consumindo versoes fixadas;
  - atualizar por PR de dependencia (com testes de contrato e E2E).

## Status de satisfacao

Com as mudancas desta rodada: **satisfeito para operacao atual em repositorio derivado**.
Para ficar "10/10 em escala multiplos produtos", ainda faria a extracao para pacote versionado com SemVer.

## Fontes

- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork
- https://git-scm.com/docs/git-rerere
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule
- https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template
- https://docs.npmjs.com/about-semantic-versioning
- https://docs.npmjs.com/cli/v11/using-npm/workspaces
- https://martinfowler.com/bliki/StranglerFigApplication.html
