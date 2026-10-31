# ADR-003 — Apollo Client 4 e GraphQL Codegen como camada de dados

- **Status:** aceita
- **Data:** 2026-10-30
- **Substitui:** a decisão de dados remotos do [ADR-002](ADR-002-dependencias-de-dados-ui-e-formularios.md) (TanStack Query). As decisões de componentes (sem shadcn/ui) e formulário (sem React Hook Form) do ADR-002 continuam valendo.
- **Contexto de decisão:** revisão de 30/10/2026, antes do UC02. Prompt: [SETUP-01](../prompts/SETUP-01-apollo-client-e-codegen.md).

## Contexto

O ADR-002 escolheu o TanStack Query sobre um `fetch` próprio. O cache seria por chave (`['animes', filtros]`), com `useSuspenseInfiniteQuery`, `flattenUniqueById` e DTOs do AniList escritos à mão. Na revisão, três pontos pesaram contra:

- **O AniList é GraphQL e publica o schema.** Com `fetch` + TanStack Query, os DTOs, enums (`MediaFormat`, `MediaSort`) e variáveis seriam digitados à mão e poderiam divergir da API sem ninguém perceber. Com Codegen, os tipos saem do schema e a query é validada contra ele.
- **O detalhe (UC03) usa o mesmo `Media` da listagem.** Num cache por chave, cada combinação de filtros guarda a própria cópia de cada anime. Num cache normalizado, `Media:<id>` existe uma vez só e o detalhe lê o que a grade já trouxe.
- **A paginação do "Ver mais" vira configuração.** `keyArgs` e `merge` nas `typePolicies` declaram como as páginas se acumulam. Somem o `getNextPageParam`, o `select` e o achatamento manual.

O custo conhecido é o tamanho do bundle, medido abaixo.

## Decisão

Usar **Apollo Client 4 como a única camada de dados remotos**, com tipos gerados pelo **GraphQL Codegen**, atrás da mesma facade `use-catalog` do plano.

| Peça              | Implementação                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Client            | `createApolloClient({ uri?, fetch?, logErrors? })` em `src/services/anilist/apollo-client.ts`: factory pura, link `ErrorLink → HttpLink`, `cache-first` / `nextFetchPolicy: cache-first`, sem polling e **sem `RetryLink`**.                                       |
| Cache             | `createCache()` em `cache.ts`. `Media` normaliza por `id`. `Query.Page` ignora `page` na chave e usa `merge: true`. `Page.media` concatena e deduplica por `readField("id")`. `Page.pageInfo` fica com o último valor recebido.                                    |
| Query             | `ANIME_PAGE` (operação `AnimePage`) em `queries/page.graphql.ts`, tipada com `TypedDocumentNode<AnimePageQuery, AnimePageQueryVariables>`.                                                                                                                         |
| Tipos             | `codegen.ts`: `pnpm codegen:schema` baixa o schema para `schema.graphql` (versionado). `pnpm codegen` gera `schema-types.generated.ts` (enums e inputs) e `*.graphql.generated.ts` ao lado de cada operação (`near-operation-file`). Os gerados ficam fora do Git. |
| Domínio           | `mappers.ts` é a única camada que conhece os tipos gerados: `toAnime`, `toAnimePage`, `toAnimePageVariables`. Componentes recebem só `src/domain/anime.ts`.                                                                                                        |
| Estado do cliente | `catalog-filters-reducer.ts` (formatos, termo, itens por página), como no ADR-002. As variáveis da query derivam dele.                                                                                                                                             |
| Facade            | `useCatalog()` devolve `{ animes, hasNextPage, isLoadingMore, loadMore, filters, isFiltering, toggleFormat, clearFormats, search, setPerPage }`. `useCatalogRetry()` é usado pelo Error Boundary.                                                                  |
| Provider          | `CatalogProvider` é o único lugar com `ApolloProvider`. O `client` vem por prop: `main.tsx` cria o real, os testes criam o seu com `createTestApolloClient()`.                                                                                                     |
| Erros             | `ErrorBoundary` próprio (`src/components/feedback`) com "Tentar novamente". Erro GraphQL chega como `CombinedGraphQLErrors`; HTTP 500 e 429 chegam como `ServerError`. Nenhuma requisição é reenviada sozinha.                                                     |
| Fronteira         | ESLint `no-restricted-imports`: importar `@apollo/client*` é erro fora de `src/services` e `src/features`. Um teste roda o ESLint para garantir a regra.                                                                                                           |

### Ajustes em relação ao prompt SETUP-01

| Ponto do prompt                                     | O que foi feito e por quê                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Query.Page` com `keyArgs: ["perPage"]`             | `keyArgs: ["perPage", "$search", "$formats", "$sort"]`. O `pageInfo` é irmão de `media`, não filho. Com só `perPage` na chave, todas as combinações dividiriam o mesmo `pageInfo`, e voltar a um filtro mostraria o `hasNextPage` de outro. Um teste cobre isso. O `keyArgs` de `media` ficou como pedido.                                                                                         |
| Reset do Error Boundary chama o `refetch` da facade | O componente que falhou nem chega a montar, então não existe `refetch` para chamar. E o Apollo guarda a referência com erro no suspense cache por até 30 s, então só remontar devolveria o mesmo erro. `useCatalogRetry()` muda um contador que entra no `queryKey` do `useSuspenseQuery`: nasce uma referência nova e a requisição é refeita. O cache normalizado continua valendo.               |
| `graphql` mais recente                              | Fixado em `^16`, porque o `near-operation-file-preset` 5.2 não aceita o 17 (o Apollo 4 aceita os dois).                                                                                                                                                                                                                                                                                            |
| Dependências da lista                               | Entraram também `@graphql-typed-document-node/core` (dev; o código gerado importa dele e o pnpm estrito não o resolve como dependência indireta) e `msw` (dev; já previsto no plano para o UC02). Um `pnpm.overrides` força `@graphql-tools/utils@^12.0.2` dentro do preset, que trazia duas vulnerabilidades _high_ (GHSA-7mx3-vvmw-hjmv, GHSA-c4qx-w738-7hr3) e reprovaria o `pnpm audit` do CI. |
| `src/test/apollo.ts`                                | Virou `apollo.tsx` (tem JSX), e `renderWithCatalog` é assíncrono. No React 19, um componente que suspende durante o `act` síncrono do `render` não volta a renderizar depois. Por isso o render e os cliques que suspendem (`clickAndWait`) usam `await act(async () => …)`.                                                                                                                       |
| MSW                                                 | O MSW 3 tirou o `graphql` da entrada principal (agora é `msw/graphql`) e renomeou `onUnhandledRequest` para `onUnhandledFrame`.                                                                                                                                                                                                                                                                    |
| `typed-document-node`                               | Continua gerando `AnimePageDocument`, mas o código usa o `gql` de `page.graphql.ts` tipado com os tipos gerados. O documento pré-compilado não é importado e não vai para o bundle.                                                                                                                                                                                                                |
| Reducer de filtros                                  | Ainda não existia. Foi criado com `toggleFormat`, `clearFormats`, `search` (com `trim`) e `setPerPage`, porque as variáveis da facade dependem dele. Os UCs 04 a 06 só ligam a interface a essas ações.                                                                                                                                                                                            |

## Alternativas consideradas

| Alternativa                                          | Motivo da rejeição                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TanStack Query + `fetch` próprio (ADR-002)           | Bundle bem menor, mas os tipos do AniList seriam escritos à mão, sem validação contra o schema. O cache por chave duplica o mesmo `Media` em cada combinação, e o detalhe (UC03) não teria de onde ler sem configurar `initialData` à mão. |
| Apollo + TanStack Query juntos                       | Dois caches para a mesma query, com duas fontes da verdade, duas formas de invalidar e o peso das duas bibliotecas somado.                                                                                                                 |
| `fetch` próprio + cache de promises (plano original) | O ADR-002 já tinha rejeitado: recria cache por chave, deduplicação e acúmulo de páginas com mais código e mais testes, e continuaria sem tipos gerados.                                                                                    |
| Codegen com client preset                            | A doc do Apollo desaconselha: gera código de runtime, pesa no bundle e conflita com o data masking. Ficou `typescript-operations` + `typed-document-node` + `near-operation-file`, como a doc recomenda.                                   |

## Consequências

**Positivas**

- Tipos da query e das variáveis gerados do schema: se a query sair do schema, `pnpm codegen` falha antes do build e do CI.
- `Media:<id>` normalizado: o UC03 lê da listagem sem nova requisição. Voltar a um filtro já visto não chama a rede (há teste contando as chamadas no handler).
- Paginação declarativa: não há `getNextPageParam`, `select` nem achatamento manual. A deduplicação mora no `merge` do cache, que tem teste.
- A fronteira é garantida por lint e testada: componentes não importam o Apollo e não veem tipos gerados.

**Negativas e mitigação**

- **Bundle maior.** Medido em 30/10/2026 com esbuild minificado + gzip, mesmo uso nos dois casos (provider + hook suspenso + paginação), descontado o React base (69,0 KB gzip):

  | Biblioteca                                                                                                           | Custo (gzip) |
  | -------------------------------------------------------------------------------------------------------------------- | ------------ |
  | `@tanstack/react-query` 5.105 (`useSuspenseInfiniteQuery`)                                                           | **+9,9 KB**  |
  | `@apollo/client` 4.3.5 + `graphql` 16 + `rxjs` (`useSuspenseQuery`, `HttpLink`, `ErrorLink`, `InMemoryCache`, `gql`) | **+63,6 KB** |

  No build real do Vite, o JS foi de 68,95 KB para 118,85 KB gzip (**+49,9 KB**). Esse número ainda não conta `useSuspenseQuery` nem o parser do `gql`, porque nenhuma tela usa a facade ainda. Quando o UC02 usar, o esperado é ficar perto dos +63,6 KB. O Apollo custa cerca de **6×** o TanStack Query.
  Mitigação: o Lighthouse continua em Performance 100 com o Apollo no bundle e a nota mínima de 90 segue como gate do CI. Se cair, há dois caminhos: carregar o catálogo sob demanda (`lazy`) ou trocar o adapter. A facade isola a troca e os componentes não mudam.
- **Mais um passo de build.** `pnpm codegen` roda antes de `validate`, `typecheck`, `test` e `build` (pre-scripts) e é um passo explícito no CI. Como o schema é versionado, o CI não acessa a rede. Atualizar o schema é manual (`pnpm codegen:schema`) e deve ser revisado no PR, como a base do ADR-001.
- **Ferramentas do Codegen exigem cuidado.** O preset pede `graphql@16` e um override de segurança. Ao atualizar o Codegen, rever o `pnpm.overrides`.
- **Testes com Suspense precisam de `act` assíncrono.** Está documentado em `src/test/apollo.tsx` e nos prompts dos UCs.

## Referências

- Apollo, [Migrating to Apollo Client 4](https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration), [GraphQL Codegen](https://www.apollographql.com/docs/react/development-testing/graphql-codegen) e [Pagination core API](https://www.apollographql.com/docs/react/pagination/core-api).
- AniList, [GraphQL API](https://docs.anilist.co) (`Page`, `pageInfo`, `Media`, `MediaFormat`, `MediaSort`).
- [ADR-002](ADR-002-dependencias-de-dados-ui-e-formularios.md), que este ADR substitui na parte de dados.
