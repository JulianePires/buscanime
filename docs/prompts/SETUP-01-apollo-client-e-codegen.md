# Prompt — SETUP-01 Configurar Apollo Client e GraphQL Codegen

Pré-requisito do UC02. Troca o TanStack Query (ADR-002) pelo Apollo Client 4 como cliente GraphQL e cache de servidor, com tipos gerados do schema do AniList. Decisão tomada na revisão de 30/10/2026: **só Apollo**, sem React Query, para não manter dois caches da mesma query.

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime (React 19 + TypeScript + Vite + React Compiler). Trabalhe em TDD estrito e trate esta tarefa como infraestrutura: nenhuma tela nova, só a fundação de dados testada e documentada.
</papel>

<objetivo>
Deixar o Apollo Client 4 configurado e testado como única camada de dados remotos, com queries tipadas por GraphQL Codegen, cache normalizado que acumula as páginas do "Ver mais" e uma facade que impede os componentes de importar o Apollo, registrando a troca em um ADR-003.
</objetivo>

<retrieval>
Leia, nesta ordem, antes de editar:
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md e docs/adr/ADR-002-dependencias-de-dados-ui-e-formularios.md (o que será substituído e o que continua valendo)
2. docs/PLANO-IMPLEMENTACAO.md (arquitetura alvo, padrões, dependências)
3. docs/REQUISITOS.md (RF02 a RF07, RNF02, RNF06) e docs/USE_CASES.md (UC02, UC04 a UC06)
4. docs/prompts/UC02-listagem-de-animes.md até UC06 (pontos que citam TanStack Query)
5. .github/workflows/ci.yml, package.json, eslint.config.js, biome.json, tsconfig.app.json, vitest.config.ts
Documentação externa (versões atuais, não use a memória):
- https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration
- https://www.apollographql.com/docs/react/development-testing/graphql-codegen
- https://www.apollographql.com/docs/react/pagination/core-api
- https://docs.anilist.co (Page, pageInfo, Media, MediaFormat, MediaSort)
</retrieval>

<restricoes>
Dependências
- Runtime: @apollo/client (4.x), graphql, rxjs (peer obrigatório no Apollo 4).
- Dev: @graphql-codegen/cli, @graphql-codegen/schema-ast, @graphql-codegen/typescript-operations, @graphql-codegen/typed-document-node, @graphql-codegen/near-operation-file-preset.
- Não instalar @tanstack/react-query, graphql-request nem react-error-boundary. Não usar o client preset do Codegen (a doc do Apollo desaconselha: adiciona código de runtime e conflita com o data masking).

Imports do Apollo 4 (os antigos quebram)
- Núcleo: ApolloClient, InMemoryCache, HttpLink de "@apollo/client"; ErrorLink de "@apollo/client/link/error".
- React: ApolloProvider, useSuspenseQuery de "@apollo/client/react".
- Testes: MockLink/MockedProvider de "@apollo/client/testing" e "@apollo/client/testing/react", só se for preciso; o padrão é MSW.
- O HttpLink precisa ser criado explicitamente (a opção `uri` no construtor não cria mais o link).
- Erros: um único `error`; use CombinedGraphQLErrors.is(error) e ServerError.is(error). ApolloError não existe mais.

Arquitetura (mantém o DIP do plano)
- src/services/anilist/apollo-client.ts: factory pura createApolloClient({ uri, fetch? }) → ApolloClient. Sem singleton importado por componentes.
- src/services/anilist/cache.ts: createCache() com as typePolicies (abaixo), exportada para os testes.
- src/services/anilist/queries/page.graphql.ts: documento ANIME_PAGE com gql e tipos gerados ao lado (page.graphql.generated.ts).
- src/services/anilist/mappers.ts recebe os tipos gerados e devolve o domínio (src/domain/anime.ts). Componentes nunca veem tipos gerados.
- src/features/catalog/CatalogProvider.tsx: único lugar com ApolloProvider; aceita `client` por prop (testes injetam outro).
- src/features/catalog/use-catalog.ts: facade. Expõe { animes, hasNextPage, isLoadingMore, loadMore, filters, ...ações } e esconde useSuspenseQuery/fetchMore. Regra de lint: proibir import de "@apollo/client*" fora de src/services e src/features (no-restricted-imports com overrides).
- Estado dos filtros continua no reducer puro (catalog-filters-reducer.ts), como no ADR-002. Variáveis da query derivam dele.

Cache e paginação (AniList `Page` não tem id)
- Query.fields.Page: keyArgs: ["perPage"] → todas as páginas da mesma combinação caem no mesmo objeto Page.
- Page.fields.media: keyArgs: ["type", "search", "format_in", "sort"] e merge que concatena existing + incoming deduplicando por readField("id").
- Page.fields.pageInfo: merge(_, incoming) { return incoming } (vale o último pageInfo, sem aviso de perda de dados).
- Media normaliza pelo `id` padrão (Media:<id>), o que deixa o detalhe (UC03) ler do cache sem nova requisição.
- Valores nulos do AniList: passar `search`/`format_in` como `undefined` quando vazios (null remove o filtro, mas undefined evita variáveis inúteis na chave).
- fetchPolicy padrão "cache-first"; nextFetchPolicy "cache-first". Sem polling.

Links e erros
- link = ErrorLink (loga em dev via import.meta.env.DEV, sem console em produção — respeitar no-console) → HttpLink({ uri: "https://graphql.anilist.co" }).
- Não reenviar requisições automaticamente em HTTP 429 (rate limit do AniList); propagar o erro para o Error Boundary com "Tentar novamente".

Suspense e transições
- useSuspenseQuery dentro da facade; troca de filtros dentro de startTransition para manter a lista anterior visível.
- loadMore chama fetchMore({ variables: { page: currentPage + 1 } }) dentro de useTransition; isLoadingMore vem do isPending.
- Error Boundary próprio (classe pequena em src/components/feedback/ErrorBoundary.tsx) com reset que chama o refetch exposto pela facade.

Codegen
- codegen.ts com dois alvos: (1) schema-ast salvando src/services/anilist/schema.graphql a partir de https://graphql.anilist.co (script manual `pnpm codegen:schema`, resultado commitado para CI offline e reprodutível, no espírito do ADR-001); (2) typescript-operations + typed-document-node com near-operation-file lendo o schema local, conforme a configuração recomendada pela doc do Apollo (nonOptionalTypename: true, skipTypeNameForRoot: true).
- Arquivos *.generated.ts no .gitignore, ignorados por ESLint e Biome; scripts: `codegen`, `codegen:schema`, `codegen:watch`. `validate`, `typecheck`, `test` e `build` rodam `pnpm codegen` antes (pre-scripts ou encadeamento).
- CI: adicionar o passo "Gerar tipos (GraphQL Codegen)" nos jobs que compilam ou testam, antes do primeiro comando que depende dos tipos.

Escopo
- Anti-objetivos: não criar cards, grade, filtros nem botões; não alterar o design; não mexer em shadcn/React Hook Form (decisões do ADR-002 que continuam valendo).
- React Compiler: sem useMemo/useCallback manuais. Sem any. Commits de até 30 arquivos.
</restricoes>

<criterios_bdd>
Dado que a aplicação inicia
Quando o CatalogProvider monta
Então os componentes recebem dados do AniList apenas pela facade use-catalog

Dado que a primeira página de uma combinação de filtros já foi carregada
Quando a página seguinte é pedida
Então o cache deve guardar as duas páginas no mesmo resultado, sem animes repetidos
E o pageInfo deve refletir a última página

Dado que o visitante volta a uma combinação de filtros já vista
Quando a query é executada de novo
Então os dados devem vir do cache sem nova requisição

Dado que a API responde com erro GraphQL, HTTP 500 ou HTTP 429
Quando a query é executada
Então o erro deve chegar ao Error Boundary com a opção de tentar novamente
</criterios_bdd>

<plano_tdd>
1. cache.test.ts: escrever duas respostas de Page (page 1 e 2, com um id repetido) via cache.writeQuery e ler com readQuery → itens concatenados, sem duplicata, pageInfo da página 2.
2. cache.test.ts: combinações diferentes de format_in/search geram entradas separadas; perPage diferente também.
3. apollo-client.test.ts (MSW): a requisição vai para graphql.anilist.co por POST com operationName "AnimePage" e as variáveis esperadas; search/format_in ausentes quando vazios.
4. apollo-client.test.ts (MSW): GraphQL `errors` → CombinedGraphQLErrors; HTTP 500 e 429 → ServerError; nenhuma nova tentativa automática em 429.
5. mappers.test.ts: tipo gerado → domínio (título com fallback, gêneros limitados a 3, averageScore nulo).
6. use-catalog.test.tsx (MSW + createTestApolloClient com cache novo): suspende e entrega animes do domínio; loadMore acumula; voltar a filtros anteriores não dispara requisição (contar chamadas no handler).
7. ErrorBoundary.test.tsx: erro da query mostra "Tentar novamente"; clicar refaz a requisição.
8. eslint-boundaries.test.ts: rodar a API do ESLint (lintText) com um import de "@apollo/client/react" num caminho de src/components e esperar erro de no-restricted-imports.
Utilitário: src/test/apollo.ts com createTestApolloClient() (cache novo por teste, sem retry) e renderWithCatalog().
</plano_tdd>

<design>
Query mínima (nomear a operação para MSW e devtools):
query AnimePage($page: Int!, $perPage: Int!, $search: String, $formats: [MediaFormat], $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage }
    media(type: ANIME, search: $search, format_in: $formats, sort: $sort) {
      id
      title { romaji english }
      coverImage { extraLarge color }
      genres
      averageScore
      format
    }
  }
}
Campos do detalhe (UC03) entram depois, no próprio UC, reaproveitando o Media normalizado.
</design>

<arquivos>
Novos: codegen.ts, src/services/anilist/{apollo-client,cache}.ts (+ testes), src/services/anilist/schema.graphql,
src/services/anilist/queries/page.graphql.ts, src/features/catalog/{CatalogProvider.tsx,use-catalog.ts} (+ teste),
src/components/feedback/ErrorBoundary.tsx (+ teste), src/test/apollo.ts, src/test/msw/{server,handlers}.ts,
docs/adr/ADR-003-apollo-client-como-camada-de-dados.md.
Alterados: package.json, .gitignore, eslint.config.js, biome.json, src/test/setup.ts, src/main.tsx, .github/workflows/ci.yml,
docs/adr/ADR-002 (status "parcialmente substituída pelo ADR-003" só na parte de dados), docs/PLANO-IMPLEMENTACAO.md,
docs/prompts/UC02 a UC06 (trocar useSuspenseInfiniteQuery/QueryErrorResetBoundary/createTestQueryClient pelos equivalentes Apollo),
docs/ARQUITETURA-E-FERRAMENTAS.md, docs/CHANGELOG.md, docs/AI_LOG.md, README.md.
Divisão sugerida de commits: (1) build: add apollo client and graphql codegen; (2) feat: configure apollo cache and catalog facade; (3) ci: generate graphql types in pipeline; (4) docs: replace tanstack query with apollo client (adr-003).
</arquivos>

<verificacao>
pnpm codegen && pnpm validate && pnpm typecheck && pnpm test:e2e
Conferir: nenhum import de "@apollo/client" em src/components; nenhum *.generated.ts versionado; schema.graphql versionado; bundle com Apollo medido no build (registrar o tamanho gzip no ADR-003 comparado ao TanStack Query).
</verificacao>

<saida>
(1) Resumo; (2) ADR-003 com contexto, decisão, alternativas (TanStack Query do ADR-002, Apollo + Query juntos, fetch próprio) e consequências, incluindo o custo de bundle medido; (3) o que mudou no plano e nos prompts UC02–UC06; (4) resultados dos comandos; (5) mensagens de commit convencionais; (6) entrada para docs/AI_LOG.md.
</saida>
```
