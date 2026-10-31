# Changelog

Mudanças documentadas por commit, seguindo [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e Conventional Commits. Cada entrada leva a mensagem do commit correspondente; o hash pode ser consultado com `git log --oneline`.

## [Unreleased]

### `chore: initial commit` (main)

- Commit vazio que inicia a `main`, base para a branch `feat/estrutura-base` e para o cálculo de versão.

### `build: scaffold vite react app with tailwind`

#### Added

- Projeto React 19 + TypeScript + Vite com React Compiler e Tailwind CSS 4.
- Estrutura base da página (UC01): cabeçalho com navegação principal rotulada e área principal.
- `.gitattributes` normalizando finais de linha para LF.
- `index.html` com `lang="pt-BR"`, título e descrição voltados à busca de animes.

### `chore: configure quality gates and commit conventions`

#### Added

- ESLint com regras de code smells (tamanho, complexidade, legibilidade, código morto, duplicação e SonarJS).
- Biome para formatação e lint complementar, incluindo arquivos de configuração.
- Vitest + Testing Library com testes de UC01 e Playwright com o fluxo e2e de UC01.
- Commitlint, Husky e configuração do lint-staged usada pelo `pre-commit`.
- `scripts/lighthouse.js` e comandos `lighthouse` / `lighthouse:ci` gerando `reports/lighthouse.html`.
- `scripts/bump-versions.js` adaptado para pacote único (somente `package.json` da raiz), sem erro quando não há `main`, com testes das regras de bump.

### `docs: document project, design, requirements and use cases`

#### Added

- README com descrição baseada no Figma, UC01 a UC06 e seções de design, RF, RNF, casos de uso e arquitetura/ferramentas.
- `docs/DESIGN.md` com estrutura da página, tokens de cor e tipografia do Figma.
- Documentos por tipo em `docs/`: requisitos, casos de uso (BDD/TDD), arquitetura e ferramentas, changelog e AI log.
- Decisões de arquitetura: React 19 pelas novas funcionalidades e React Compiler para otimização da renderização.
- Versionamento de pacote único e fluxo de branches em `ARQUITETURA-E-FERRAMENTAS.md`.

### `docs: adopt load more pagination and define score colors`

#### Changed

- RF06, UC06, README e arquitetura: paginação pelo botão "Ver mais" no lugar do scroll infinito.
- `DESIGN.md`: faixas de cor da nota (`< 50` perigo, `50–80` alerta, `> 80` sucesso) e AniList confirmado como fonte de dados.

#### Added

- Cenário BDD de cor da nota no UC02 e AniList na stack.

### `feat: add design assets exported from figma`

#### Added

- `public/brand/logo.svg` (logo BUSCANIME em contorno) e `public/icons/add.svg` (ícone do "Ver mais"), exportados dos nós do Figma.

### `docs: add design context base and rag adr`

#### Added

- `docs/design-context/`: manifesto por caso de uso, tokens em JSON, specs por seção, renders de referência, fixtures dos cards e código de referência do Figma.
- `docs/adr/ADR-001-base-de-contexto-de-design-rag.md`: decisão de usar a base local como fonte de retrieval da IA.
- `docs/adr/ADR-002-dependencias-de-dados-ui-e-formularios.md`: TanStack Query para dados remotos; componentes e busca sem shadcn/ui e sem React Hook Form. Plano e prompts UC02, UC04, UC05 e UC06 atualizados.

#### Changed

- `DESIGN.md`: tipografia corrigida (logo Mulish Regular 40 px), seção de assets, divergências de contraste e lacunas do design.
- README e arquitetura: seção da base de contexto e nova estrutura de pastas.

### `docs: add implementation plan and use case prompts`

#### Added

- `docs/PLANO-IMPLEMENTACAO.md`: arquitetura alvo, padrões de projeto, sequência, plano por UC, Definition of Done e decisões em aberto.
- `docs/prompts/`: padrão de prompt e prompts de UC01 a UC06.

### `docs: confirm score color thresholds`

#### Changed

- `DESIGN.md` e AI log: faixas da nota reconfirmadas (50 e 80 na faixa amarela), prevalecendo sobre o exemplo de 80% em verde no Figma.

### `build: enforce lighthouse minimum scores`

#### Changed

- `scripts/lighthouse.js` gera relatórios HTML e JSON (`reports/lighthouse.report.*`), falha abaixo das notas mínimas (performance 90, acessibilidade 95, boas práticas 90, SEO 90) e chama o CLI sem shell.

#### Added

- `scripts/lighthouse.test.js` com as regras de nota mínima.

### `ci: add github actions pipeline`

#### Added

- `.github/workflows/ci.yml`: commits e versionamento → qualidade, segurança (pnpm audit, Dependency Review) e CodeQL → testes → build → e2e e Lighthouse.
- `.github/actions/setup`: ação composta com Node 24, pnpm e `pnpm install --frozen-lockfile`.
- `package.json`: script `typecheck`, `packageManager` (pnpm 10.34.6) e `engines` (Node 22.12+).

### `docs: document ci pipeline`

#### Changed

- `ARQUITETURA-E-FERRAMENTAS.md`: seção de integração contínua, estágios, decisões e novos comandos.
- README: seção de integração contínua e pré-requisitos.
- AI log: registro desta alteração.

### `build: add apollo client and graphql codegen`

#### Added

- `@apollo/client` 4, `graphql` 16 e `rxjs` como dependências; GraphQL Codegen (`cli`, `schema-ast`, `typescript-operations`, `typed-document-node`, `near-operation-file-preset`), `@graphql-typed-document-node/core` e `msw` como devDependencies.
- `codegen.ts` com dois alvos: `pnpm codegen:schema` (baixa `src/services/anilist/schema.graphql`, versionado) e `pnpm codegen` (tipos das operações ao lado de cada query); `codegen:watch` e pre-scripts em `validate`, `typecheck`, `test` e `build`.
- Query `AnimePage` em `src/services/anilist/queries/page.graphql.ts`.
- `no-restricted-imports` no ESLint: `@apollo/client*` só em `src/services` e `src/features`.

#### Changed

- `.gitignore`, ESLint e Biome ignoram `*.generated.ts`; o Biome passa a formatar `codegen.ts`.
- `pnpm.overrides` fixa `@graphql-tools/utils@^12.0.2` no `near-operation-file-preset` (GHSA-7mx3-vvmw-hjmv, GHSA-c4qx-w738-7hr3).

### `feat: configure apollo cache and catalog facade`

#### Added

- `createApolloClient()` (ErrorLink → HttpLink, `cache-first`, sem reenvio automático) e `createCache()`: páginas acumuladas sem repetição, `pageInfo` da última página e uma entrada por combinação de filtros.
- `mappers.ts` (tipos gerados ↔ domínio) e `src/domain/anime.ts`.
- `catalog-filters-reducer.ts` (`toggleFormat`, `clearFormats`, `search`, `setPerPage`), `CatalogProvider`, `useCatalog()` e `useCatalogRetry()`.
- `ErrorBoundary` com "Tentar novamente".
- Testes: cache, client (MSW, erros GraphQL/500/429), mappers, reducer, facade (Suspense, "Ver mais", cache ao voltar a um filtro), Error Boundary e fronteira de lint. Utilitários `src/test/apollo.tsx`, `src/test/msw/*` e `src/test/fixtures/anime-page.ts`.

#### Changed

- `src/main.tsx` cria o client e envolve o `App` no `CatalogProvider`.

### `ci: generate graphql types in pipeline`

#### Changed

- Passo "Gerar tipos (GraphQL Codegen)" nos jobs de qualidade, testes e build, antes do primeiro comando que depende dos tipos.

### `docs: replace tanstack query with apollo client (adr-003)`

#### Added

- `docs/adr/ADR-003-apollo-client-como-camada-de-dados.md`, com o custo de bundle medido.
- Prompt `docs/prompts/SETUP-01-apollo-client-e-codegen.md` no índice dos prompts.

#### Changed

- ADR-002 parcialmente substituído (só a parte de dados); plano, prompts UC02 a UC06, arquitetura, README e AI log alinhados ao Apollo Client.

### `feat: add score tone rule to domain`

#### Added

- `src/domain/score.ts`: `scoreTone()` com as faixas da nota em tabela (`< 50` danger, `50–80` warning, `> 80` success) e `formatScore()`, testados nos limites e com os 12 cards do Figma.

### `feat: list animes in cards with loading, empty and error states`

#### Added

- `AnimeCard`, `AnimeGrid`, `ScoreBadge` e `GenreChip` (card 317 × 270, grade de 4 colunas responsiva); `LoadingState` (esqueleto) e `EmptyState`; `CatalogResults` lendo `useCatalog()`.
- Token `--color-black` para o texto da nota sobre `warning`/`success` (contraste WCAG).
- Preconnect para `graphql.anilist.co` e `s4.anilist.co`.

#### Changed

- `App` compõe `ErrorBoundary` (`onReset={useCatalogRetry()}`) + `Suspense`; o `main` limita 1316 px ao conteúdo, com o gutter por fora.
- `ErrorBoundary` estilizado com os tokens do projeto.
- Testes do UC01 renderizam dentro do `CatalogProvider`.

### `test: verify anime listing end to end`

#### Added

- e2e do UC02 com `page.route` (12 cards do Figma, grade de 4 colunas a 1366 px, nota 80 em amarelo); a API e as capas ficam mockadas em todo o arquivo.
- Entrada do UC02 no `AI_LOG.md`.

### `feat: open anime detail in accessible dialog`

#### Added

- `AnimeDetailDialog`: `<dialog>` nativo com `showModal()`, nome pelo título (`aria-labelledby`), título em inglês, capa, gêneros, nota, formato, episódios, ano, situação, sinopse e link para o AniList; `<title>` do React 19 enquanto aberto.
- `src/domain/formats.ts` (`FORMAT_OPTIONS`, `formatLabel`) e `src/domain/status.ts` (`statusLabel`) como tabelas de rótulos.
- Polyfill mínimo de `showModal`/`close`/Esc em `src/test/setup.ts` e fixture `zom100` compartilhada.

#### Changed

- `ANIME_PAGE` pede `description(asHtml: false)`, `episodes`, `seasonYear`, `status` e `siteUrl`; `toAnime` limpa a sinopse (tags e entidades HTML) e não repete o título em inglês igual ao principal.
- `AnimeCard` ganha um botão que cobre o card (nome = título); o anel de foco passa a `has-[:focus-visible]` no `article`. `AnimeGrid` guarda o anime selecionado e devolve o foco ao card ao fechar.

### `test: verify anime detail by keyboard end to end`

#### Added

- e2e do UC03: Tab até o card, Enter abre, Esc fecha com o foco de volta e o título restaurado, sem nova requisição; superfície do modal conferida (branco, raio 8, padding 24, 720 px).
- `e2e/support/anilist.ts` com o mock do AniList compartilhado pelos specs.
- Entrada do UC03 no `AI_LOG.md`.
