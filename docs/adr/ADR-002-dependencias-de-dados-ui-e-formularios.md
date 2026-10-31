# ADR-002 — TanStack Query para dados remotos; componentes e formulário nativos

- **Status:** parcialmente substituída pelo [ADR-003](ADR-003-apollo-client-como-camada-de-dados.md) na parte de dados remotos (TanStack Query → Apollo Client 4 + GraphQL Codegen). As decisões de componentes e formulário continuam aceitas.
- **Data:** 2026-10-30
- **Contexto de decisão:** revisão do [plano de implementação](../PLANO-IMPLEMENTACAO.md) antes do UC02, avaliando três dependências candidatas.

## Contexto

O Buscanime faz **um único tipo de requisição** (`Page` do AniList), mas ela varia por formatos, termo de busca e tamanho de página, e acumula páginas no "Ver mais". O plano original resolvia isso à mão: reducer com `pages`, `mergePages`, cancelamento com `AbortSignal`, retry e leitura com `use` + `Suspense`.

Dois fatos pesam na decisão:

- **`use()` exige promise estável entre renders.** Sem um cache de promises por chave, cada render cria uma requisição nova. Ou seja, o plano original obrigava a escrever um cache próprio.
- **O cache HTTP do navegador não ajuda.** O AniList é GraphQL via `POST`, que o cache HTTP não guarda. "Cache nativo" seria um `Map` em memória mantido pelo projeto.

A interface tem poucos componentes (botão, chip, toggle, input, card, dialog, select), design próprio no Figma e tokens no `@theme`. O único formulário é um campo de busca com submit.

Critério adotado: **uma dependência entra quando remove mais complexidade do que adiciona.**

## Decisão

| Tema          | Decisão                                                                                | Motivo                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dados remotos | ~~Adotar `@tanstack/react-query` (v5)~~ — substituída pelo ADR-003                     | Substitui cache de promises, acúmulo de páginas, cancelamento, retry e deduplicação de requisições escritos à mão.                                                                                |
| Componentes   | **Não adotar shadcn/ui**; componentes próprios sobre elementos nativos                 | `<dialog>` já resolve foco, Esc e top-layer; `<select>` atende 12/24/48. O shadcn traria Radix/Base UI, `cva`, `clsx`, `tailwind-merge` e variáveis de tema concorrentes com os tokens do design. |
| Formulário    | **Não adotar React Hook Form**; input não controlado lido via `FormData` no `onSubmit` | Um campo, sem validação complexa nem estado _dirty_.                                                                                                                                              |

### Como o TanStack Query entra sem quebrar a arquitetura

> Histórico: substituído pelo [ADR-003](ADR-003-apollo-client-como-camada-de-dados.md). Continuam valendo a facade `use-catalog`, o reducer de filtros e as transições.

- A chave é `['animes', { formats, search, perPage }]`; o `queryFn` chama `AnimeRepository.searchPage(params, signal)`. A UI continua dependendo da interface, não do AniList (DIP).
- O **estado dos filtros** (formatos, termo, tamanho da página) continua num reducer puro (`catalog-filters-reducer.ts`). O **estado do servidor** (páginas, carregamento, erro) passa a ser do Query. Cada um no lugar certo.
- `use-catalog.ts` segue como facade: os componentes não importam `@tanstack/react-query`.
- `getNextPageParam` usa `pageInfo.hasNextPage`/`currentPage`. As páginas são achatadas com deduplicação por `id` numa função pura do domínio (`flattenUniqueById`), passada em `select`.
- Trocar filtros dentro de `startTransition` mantém a lista anterior visível enquanto a nova chave carrega, em vez de voltar ao fallback do Suspense.
- Erros vão para o Error Boundary com `QueryErrorResetBoundary` ("Tentar novamente"). Erro ao buscar a página seguinte não apaga as anteriores (`isFetchNextPageError`).
- `staleTime` de 5 minutos: o catálogo muda devagar e isso poupa o rate limit da API ao voltar a um filtro anterior.
- Nos testes, um `createTestQueryClient()` com `retry: false`; o MSW continua mockando a rede.

### Pegadinha registrada (formulário)

Com `<form action={fn}>`, o React 19 **reseta os campos não controlados** depois da action e o termo some da barra de busca. Por isso a busca usa `onSubmit` com `preventDefault` e `FormData`, com `defaultValue` vindo do estado dos filtros.

## Alternativas consideradas

| Alternativa                                      | Motivo da rejeição                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Reducer + `use` + cache próprio (plano original) | Recria um subconjunto do TanStack Query (cache por chave, abort, retry, páginas) com mais código e testes. |
| SWR                                              | Viável, mas `useSWRInfinite` tem integração com Suspense e cancelamento menos direta.                      |
| shadcn/ui                                        | Muito código e dependências para 7 componentes simples; tema concorrente com os tokens do Figma.           |
| React Hook Form                                  | Útil para muitos campos e validação; aqui só adicionaria peso.                                             |
| `useState` controlado na busca                   | Aceitável; fica como opção se surgir botão de limpar ou contador de caracteres.                            |

## Consequências

**Positivas**

- Menos código próprio: somem `mergePages` com estado de páginas, o cache de promises e a lógica de abort/retry.
- Cache por combinação de filtros: voltar a um filtro já visto é instantâneo.
- Componentes e formulário sem dependências, alinhados ao design e aos tokens.

**Negativas e mitigação**

- **Uma dependência a mais (~13 KB gzip)** → compensada pelo código removido; isolada atrás de `use-catalog`, pode ser trocada sem mexer nos componentes.
- **Menos "fundamentos à mostra" para quem avalia** → o ADR registra o raciocínio; reducer de filtros, repositório e mapper continuam escritos à mão.
- **Componentes acessíveis por conta própria** → testes por papel (`dialog`, `button[aria-pressed]`, `combobox`) e Lighthouse no Definition of Done.

## Referências

- Dominik Dorfmeister (TkDodo), [Why You Want React Query](https://tkdodo.eu/blog/why-you-want-react-query).
- TanStack, [Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) e [Query Cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).
- React, [`use`](https://react.dev/reference/react/use) (promises precisam vir de cache) e [`<form>`](https://react.dev/reference/react-dom/components/form) (reset após action).
- Dan McKinley, [Choose Boring Technology](https://boringtechnology.club/).
