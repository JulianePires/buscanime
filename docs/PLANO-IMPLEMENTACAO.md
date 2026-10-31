# Plano de implementação

Plano para implementar UC01 a UC06 com Claude Code, em ciclos SDD → BDD → TDD, usando a [base de contexto de design](design-context/README.md) como fonte de retrieval ([ADR-001](adr/ADR-001-base-de-contexto-de-design-rag.md)). As dependências de UI e formulário seguem o [ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md); a camada de dados segue o [ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md) (Apollo Client 4 + GraphQL Codegen), preparada pelo [SETUP-01](prompts/SETUP-01-apollo-client-e-codegen.md). Os prompts prontos estão em [`docs/prompts/`](prompts/README.md).

## Princípios

| Princípio                      | Como se aplica                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Fidelidade por retrieval       | Cada UC carrega só os chunks do `manifest.json` ligados a ele, compara com `references/` e usa só assets de `public/`.            |
| TDD (Red → Green → Refactor)   | Nenhum código de produção sem um teste vermelho antes; refatorar só com a suíte verde.                                            |
| BDD                            | Os cenários Gherkin de `USE_CASES.md` viram `describe`/`it` com o mesmo texto (rastreabilidade UC ↔ teste).                       |
| ISO/IEC 25010                  | Cada UC declara quais características de qualidade atende e como verifica (tabela abaixo).                                        |
| SOLID e baixo acoplamento      | Domínio puro, acesso a dados atrás de uma interface, componentes de apresentação sem conhecimento da API.                         |
| Dependência só se apaga código | Uma lib entra quando remove mais complexidade do que adiciona ([ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md)). |
| Entregas pequenas              | Um UC por branch e PR; commits convencionais de até 30 arquivos (`check-commit-size.js`).                                         |

## Arquitetura alvo

```text
src/
├── domain/                     # Regras puras, sem React nem rede
│   ├── anime.ts                # Anime, AnimeFormat, AnimePage, CatalogFilters (SETUP-01)
│   ├── formats.ts              # FORMAT_OPTIONS: rótulo do design ↔ AnimeFormat
│   ├── score.ts                # scoreTone(score): "danger" | "warning" | "success"
│   └── page-size.ts            # Itens por página pela largura da tela (UC06)
├── services/anilist/           # Adapter da API GraphQL (ADR-003)
│   ├── apollo-client.ts        # createApolloClient(): ErrorLink → HttpLink, cache-first (SETUP-01)
│   ├── cache.ts                # createCache(): typePolicies de Page, media e pageInfo (SETUP-01)
│   ├── schema.graphql          # Schema do AniList versionado (pnpm codegen:schema)
│   ├── queries/page.graphql.ts # ANIME_PAGE; page.graphql.generated.ts fica fora do Git
│   ├── mappers.ts              # Tipos gerados ↔ domínio (única camada que os conhece)
│   └── prefetch.ts             # Primeira página pedida pelo index.html, antes do JS
├── features/catalog/           # Estado e orquestração da listagem
│   ├── catalog-filters-reducer.ts # Estado do cliente: formats, search, perPage (SETUP-01)
│   ├── catalog-context.ts      # Contexto dos filtros e da nova tentativa
│   ├── use-catalog.ts          # Facade: useSuspenseQuery e a próxima página escondidos
│   ├── use-viewport-page-size.ts # Tamanho da página acompanha a largura (matchMedia)
│   └── CatalogProvider.tsx     # Único ApolloProvider; client injetado por prop (DIP)
├── components/                 # Apresentação (props in, eventos out)
│   ├── layout/                 # SiteHeader, SiteFooter, Logo
│   ├── filters/                # FormatFilter, SearchBar
│   ├── anime/                  # AnimeCard, AnimeGrid, ScoreBadge, GenreChip, AnimeDetailDialog
│   ├── pagination/             # LoadMoreButton
│   └── feedback/               # ErrorBoundary (SETUP-01), LoadingState, EmptyState
├── test/
│   ├── setup.ts
│   ├── fixtures/               # Builders a partir de docs/design-context/fixtures
│   ├── apollo.tsx              # createTestApolloClient(), renderWithCatalog(), clickAndWait()
│   └── msw/                    # server + handlers (graphql.link do AniList)
└── App.tsx                     # Composição da página
```

### Padrões de projeto

| Padrão                          | Onde                         | Por quê                                                                     |
| ------------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| Adapter                         | `services/anilist`           | Isola o GraphQL e o Apollo; a UI depende só da facade e do domínio (DIP).   |
| Mapper / Anti-Corruption Layer  | `mappers.ts`                 | Converte os tipos gerados (nulos, formatos) em tipos de domínio estáveis.   |
| Lookup table (Strategy simples) | `score.ts`, `formats.ts`     | Regras como dados: fácil de testar e estender sem `if` aninhado.            |
| Reducer (State)                 | `catalog-filters-reducer.ts` | Estado do cliente (filtros) com transições puras; testável sem renderizar.  |
| Cache normalizado               | `cache.ts`                   | Páginas acumuladas por `typePolicies`; `Media:<id>` único (ADR-003).        |
| Facade (custom hook)            | `use-catalog.ts`             | Esconde reducer, Apollo e transições; o lint impede importar o Apollo fora. |
| Provider (Dependency Injection) | `CatalogProvider.tsx`        | Recebe o `ApolloClient` por prop: real no `main.tsx`, de teste nos testes.  |
| Container / Presentational      | `App` + `components/`        | Componentes visuais puros, reutilizáveis e fáceis de testar.                |
| Compound/Dialog nativo          | `AnimeDetailDialog`          | `<dialog>` com foco gerenciado pelo navegador (acessibilidade).             |

### Dependências novas (propostas)

| Pacote                                | Uso                                                                                                             | UC       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| `@fontsource-variable/mulish`         | Fonte do design servida localmente                                                                              | UC01     |
| `msw`                                 | Mock da API na fronteira de rede nos testes                                                                     | SETUP-01 |
| `@apollo/client` 4, `graphql`, `rxjs` | Cliente GraphQL e cache normalizado ([ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md))              | SETUP-01 |
| `@graphql-codegen/*` (dev)            | Tipos das operações gerados do schema versionado ([ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md)) | SETUP-01 |

**Fora de escopo, por decisão:** shadcn/ui (componentes próprios sobre `<dialog>`, `<select>` e `<button>`) e React Hook Form (busca com input não controlado + `FormData`). Ver [ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md).

## Sequência e dependências

```text
UC01 ──► SETUP-01 ──► UC02 ──┬──► UC03
                             ├──► UC04 ──► UC05
                             └──► UC06
```

| Ordem | UC       | Branch                     | Entrega principal                                                    | Depende de |
| ----- | -------- | -------------------------- | -------------------------------------------------------------------- | ---------- |
| 1     | UC01     | `feat/uc01-estrutura`      | Tokens no `@theme`, Mulish, header e footer fiéis, layout responsivo | —          |
| 2     | SETUP-01 | `feat/setup-01-apollo`     | Apollo Client 4, Codegen, cache, facade e Error Boundary (sem telas) | UC01       |
| 3     | UC02     | `feat/uc02-listagem`       | Nota no domínio, card, grade, estados de carregamento/vazio/erro     | SETUP-01   |
| 4     | UC03     | `feat/uc03-detalhe`        | Modal de detalhe acessível                                           | UC02       |
| 5     | UC04     | `feat/uc04-filtro-formato` | Filtro multiformato com `format_in`                                  | UC02       |
| 6     | UC05     | `feat/uc05-busca-texto`    | Busca por texto combinada com os formatos                            | UC04       |
| 7     | UC06     | `feat/uc06-ver-mais`       | "Ver mais" acumulando páginas                                        | UC02       |

UC03, UC04 e UC06 podem ser feitos em paralelo depois do UC02.

## Plano por caso de uso

### UC01 — Visualizar estrutura da página

- **Retrieval:** `specs/layout.md`, `specs/header.md`, `specs/footer.md`, `tokens.json`; referências `header.png`, `footer.png`, `desktop-frame.png`.
- **Red:** marca no header como link "Buscanime" com o SVG; footer (`contentinfo`) com logo e "TODOS OS DIREITOS RESERVADOS"; `main` entre os dois; teste de paridade `tokens.json` × variáveis do `@theme`.
- **Green:** `@theme` com cores, fonte e raios; `SiteHeader`, `SiteFooter`, `Logo`; Mulish via Fontsource.
- **Refactor:** remover `App.css` e cores provisórias (`fuchsia`, Inter).
- **Qualidade:** usabilidade/acessibilidade (landmarks, contraste do header ≈ 8:1), compatibilidade (layout fluido), manutenibilidade (tokens únicos).
- **Prompt:** [UC01](prompts/UC01-estrutura-da-pagina.md).

### UC02 — Visualizar listagem de animes

- **Retrieval:** `specs/card.md`, `specs/layout.md` (grade), `tokens.json`, `fixtures/figma-cards.json`; referência `card.png`.
- **Red:** `scoreTone` (49/50/80/81 e nulo); grade renderiza 12 cards dos fixtures; estados carregando, vazio e erro com "Tentar novamente". Mapper, cache, client e facade já chegam testados do SETUP-01.
- **Green:** componentes consomem `useCatalog()`; `Suspense` + `ErrorBoundary` com `onReset={useCatalogRetry()}`.
- **Refactor:** extrair `ScoreBadge` e `GenreChip`; garantir `img` com `width`/`height` e `loading="lazy"`.
- **Qualidade:** adequação funcional (regra da nota), confiabilidade (erro e retry), eficiência (lazy loading, sem CLS).
- **Prompt:** [UC02](prompts/UC02-listagem-de-animes.md).

### UC03 — Visualizar detalhe do anime listado

- **Retrieval:** `specs/card.md`, `tokens.json`, `manifest.json → notInDesign.detalhe`.
- **Red:** clicar no card abre `dialog` com título, capa, gêneros, nota, formato, episódios, ano e sinopse; Esc e botão fechar devolvem o foco ao card; `<title>` muda enquanto aberto.
- **Green:** `AnimeDetailDialog` com `<dialog>` nativo e metadados do React 19.
- **Refactor:** sanitizar a sinopse (pedir `description(asHtml: false)`), reaproveitar `ScoreBadge`; os campos extras entram em `ANIME_PAGE` e o detalhe lê o `Media:<id>` do cache, sem nova requisição.
- **Qualidade:** acessibilidade (foco, Esc, nome do diálogo), segurança (sem `dangerouslySetInnerHTML`).
- **Prompt:** [UC03](prompts/UC03-detalhe-do-anime.md).

### UC04 — Filtrar lista por um ou mais formatos

- **Retrieval:** `specs/filtros.md`, `tokens.json`; referência `filtros.png`.
- **Red:** "All Formats" ativo sem seleção, `aria-pressed`, a requisição envia `formats` (`format_in`), nova combinação recomeça na página 1. O reducer (`toggleFormat`, `clearFormats`) já existe desde o SETUP-01.
- **Green:** `FormatFilter` ligado a `toggleFormat`/`clearFormats` da facade, que já aplica em transição (a lista anterior fica visível enquanto a nova combinação carrega).
- **Refactor:** `FORMAT_OPTIONS` como única fonte de rótulos e valores.
- **Qualidade:** adequação funcional, usabilidade (estado visível e anunciado), eficiência (combinação já vista vem do cache, sem requisição).
- **Prompt:** [UC04](prompts/UC04-filtro-por-formato.md).

### UC05 — Filtrar lista por busca de texto

- **Retrieval:** `specs/busca.md`, `tokens.json`; referência `busca.png`.
- **Red:** submit e Enter disparam a busca; texto vazio remove o filtro; busca combina com formatos; ordenação `SEARCH_MATCH` com texto e `POPULARITY_DESC` sem; estado vazio com o termo pesquisado.
- **Green:** `SearchBar` em `form role="search"` com input não controlado lido por `FormData` no `onSubmit` (não usar `<form action>`: o React 19 reseta o campo) + ação `search` no reducer de filtros.
- **Refactor:** normalizar o termo (trim) no domínio.
- **Qualidade:** adequação funcional, usabilidade (label acessível, feedback de vazio), eficiência (uma requisição por submit; termo repetido vem do cache).
- **Prompt:** [UC05](prompts/UC05-busca-por-texto.md).

### UC06 — Carregar mais animes pelo "Ver mais"

- **Retrieval:** `specs/ver-mais.md`, `tokens.json`; referência `ver-mais.png`; asset `public/icons/add.svg`.
- **Red:** "Ver mais" busca a página seguinte e mantém os itens; botão some sem `hasNextPage`; `aria-busy` durante o carregamento; foco vai para o primeiro card novo.
- **Green:** `LoadMoreButton`; `loadMore`/`isLoadingMore`/`loadMoreError` da facade (próxima página por `client.query`; o `merge` do cache vem do SETUP-01).
- **Refactor:** garantir que a deduplicação fique só no `merge` de `Page.media` (`cache.ts`).
- **Qualidade:** eficiência (sem refazer páginas já carregadas), acessibilidade (foco e anúncio), confiabilidade (erro na página seguinte não apaga as anteriores: a facade passa a expor `loadMoreError` em vez de lançar para o boundary).
- **Prompt:** [UC06](prompts/UC06-ver-mais-e-tamanho-da-pagina.md).

## Definition of Done (todos os UCs)

- [ ] Cenários BDD do UC cobertos por testes com o mesmo texto do Gherkin.
- [ ] `pnpm validate` verde (Biome, ESLint com smells, Vitest, build).
- [ ] `pnpm test:e2e` com o fluxo do UC.
- [ ] Comparação visual com `references/<seção>.png` registrada (print do preview no PR).
- [ ] Lighthouse sem regressão em Performance e Acessibilidade.
- [ ] Sem `useMemo`/`useCallback` manuais (React Compiler), sem `any`, sem URLs do Figma no código.
- [ ] `CHANGELOG.md` e `AI_LOG.md` atualizados; divergências do design registradas.
- [ ] Commits convencionais com até 30 arquivos.

## Decisões em aberto

| Tema                      | Proposta do plano                                                                                  | Precisa de confirmação |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| Contraste do "Ver mais"   | Branco sobre `#FFB800` tem ≈ 1,7:1; usar texto e ícone `primary` (≈ 4,6:1)                         | Sim                    |
| Contraste do chip de nota | `#E2E5E9` sobre `#01ADA6` tem ≈ 2,2:1; avaliar texto `white` em negrito                            | Sim                    |
| Tamanho da página (RF07)  | RF07 removido: sem seletor; o tamanho segue a largura da tela (3, 6, 9 ou 12)                      | Não (decidido)         |
| Título exibido            | `title.romaji` (igual ao design), `english` no detalhe                                             | Não                    |
| UI e formulário           | Sem shadcn; sem React Hook Form ([ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md)) | Não (decidido)         |
| Dados remotos             | Apollo Client 4 + GraphQL Codegen ([ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md))   | Não (decidido)         |
