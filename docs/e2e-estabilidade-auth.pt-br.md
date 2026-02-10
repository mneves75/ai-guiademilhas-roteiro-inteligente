# Estabilidade E2E (Auth) - Solucao Elegante

## Problema (o que falhava)

O fluxo de cadastro/login em E2E falhava de forma intermitente com erros do tipo "campo obrigatorio" mesmo apos o teste preencher inputs. O sintoma era submit com payload vazio ou com valores "apagados".

Isso e tipico quando:

- a pagina e um Client Component (ou depende de hooks client) e sofre remount durante hidratacao;
- o codigo usa `useSearchParams()` no topo da pagina, forca CSR bailout e exige `Suspense`;
- inputs controlados podem perder estado se a arvore React for recriada.

## Principio (o que precisa ser verdade)

Para E2E ser deterministico, a invariavel correta e:

1. Parse de query (`callbackUrl`, `token`, etc) deve ser feito de forma estavel (server), e nao depender de hidratacao.
2. O componente client do formulario deve ser pequeno, com estado local previsivel, sem hooks que induzem CSR bailout na pagina.

## Solucao (padrao de industria)

Padrao aplicado:

- Server Component: le `searchParams` (`Promise<...>` + `await`), normaliza e passa como prop.
- Client Component: implementa apenas UI + estado + submit.

Arquivos:

- `app/(auth)/signup/page.tsx` + `app/(auth)/signup/signup-form.tsx`
- `app/(auth)/login/page.tsx` + `app/(auth)/login/login-form.tsx`
- `app/(auth)/reset-password/page.tsx` + `app/(auth)/reset-password/reset-password-form.tsx`

Resultado:

- elimina dependencia de `useSearchParams()` na pagina;
- remove necessidade de workarounds (marcadores de hidratacao, retries e sleeps);
- reduz classe inteira de flakiness (nao so "arruma um teste").

## Validacao (o que garante)

- E2E roda contra build de producao (`pnpm build && pnpm start`) e database deterministico.
- `PW_FULL=1 pnpm test:e2e` cobre Chromium/Firefox/WebKit e mobile.

## Anti-padroes (o que evitar)

- adicionar estado/flags no app apenas para teste (ex.: `data-hydrated` via `useEffect`);
- aumentar `retries` globalmente para "passar CI";
- usar `waitForTimeout()` como sincronizacao principal.
