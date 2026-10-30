# Plano de implementação

Plano para implementar UC01 a UC06 com Claude Code, em ciclos SDD → BDD → TDD, usando a [base de contexto de design](design-context/README.md) como fonte de retrieval ([ADR-001](adr/ADR-001-base-de-contexto-de-design-rag.md)). As dependências de dados, UI e formulário seguem o [ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md). Os prompts prontos estão em [`docs/prompts/`](prompts/README.md).

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
│   ├── anime.ts                # Tipos Anime, AnimeFormat, AnimePage, SearchParams
│   ├── formats.ts              # FORMAT_OPTIONS: rótulo do design ↔ MediaFormat
│   ├── pagination.ts           # flattenUniqueById(pages): achata e deduplica por id
│   └── score.ts                # scoreTone(score): "danger" | "warning" | "success"
├── services/anilist/           # Adapter da API GraphQL
│   ├── client.ts               # fetch GraphQL com AbortSignal e erro tipado
│   ├── queries.ts              # Documento PAGE_QUERY
│   ├── mappers.ts              # DTO do AniList → domínio
│   └── anime-repository.ts     # AnimeRepository (interface) + implementação AniList
├── features/catalog/           # Estado e orquestração da listagem
│   ├── catalog-filters-reducer.ts # Estado do cliente: formats, search, perPage
│   ├── catalog-query.ts        # queryKey + options do useSuspenseInfiniteQuery
│   ├── use-catalog.ts          # Facade: filtros + Query (toggleFormat, search, loadMore...)
│   └── CatalogProvider.tsx     # QueryClientProvider + injeção do repositório (DIP)
├── components/                 # Apresentação (props in, eventos out)
│   ├── layout/                 # SiteHeader, SiteFooter, Logo
│   ├── filters/                # FormatFilter, SearchBar
│   ├── anime/                  # AnimeCard, AnimeGrid, ScoreBadge, GenreChip, AnimeDetailDialog
│   ├── pagination/             # LoadMoreButton, PageSizeSelect
│   └── feedback/               # LoadingState, EmptyState, ErrorState
├── test/
│   ├── setup.ts
│   ├── fixtures/               # Builders a partir de docs/design-context/fixtures
│   ├── query-client.ts         # createTestQueryClient() com retry: false
│   └── msw/                    # Handlers da API para testes de integração
└── App.tsx                     # Composição da página
```

### Padrões de projeto

| Padrão                          | Onde                         | Por quê                                                                    |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Repository + Adapter            | `services/anilist`           | Isola o GraphQL; a UI depende de `AnimeRepository`, não do AniList (DIP).  |
| Mapper / Anti-Corruption Layer  | `mappers.ts`                 | Converte nulos e formatos da API em tipos de domínio estáveis.             |
| Lookup table (Strategy simples) | `score.ts`, `formats.ts`     | Regras como dados: fácil de testar e estender sem `if` aninhado.           |
| Reducer (State)                 | `catalog-filters-reducer.ts` | Estado do cliente (filtros) com transições puras; testável sem renderizar. |
| Server state cache              | `catalog-query.ts`           | Páginas, cache por chave, abort e retry ficam com o TanStack Query.        |
| Facade (custom hook)            | `use-catalog.ts`             | Esconde reducer, Query, repositório e transições da apresentação.          |
| Provider (Dependency Injection) | `CatalogProvider.tsx`        | Troca o repositório real e o `QueryClient` por fakes nos testes.           |
| Container / Presentational      | `App` + `components/`        | Componentes visuais puros, reutilizáveis e fáceis de testar.               |
| Compound/Dialog nativo          | `AnimeDetailDialog`          | `<dialog>` com foco gerenciado pelo navegador (acessibilidade).            |

### Dependências novas (propostas)

| Pacote                        | Uso                                                                                                                   | UC   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---- |
| `@fontsource-variable/mulish` | Fonte do design servida localmente                                                                                    | UC01 |
| `msw`                         | Mock da API na fronteira de rede nos testes                                                                           | UC02 |
| `@tanstack/react-query` (v5)  | Cache por chave, páginas acumuladas, abort e retry ([ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md)) | UC02 |

**Fora de escopo, por decisão:** shadcn/ui (componentes próprios sobre `<dialog>`, `<select>` e `<button>`) e React Hook Form (busca com input não controlado + `FormData`). Ver [ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md).

## Sequência e dependências

```text
UC01 ──► UC02 ──┬──► UC03
                ├──► UC04 ──► UC05
                └──► UC06
```

| Ordem | UC   | Branch                     | Entrega principal                                                         | Depende de |
| ----- | ---- | -------------------------- | ------------------------------------------------------------------------- | ---------- |
| 1     | UC01 | `feat/uc01-estrutura`      | Tokens no `@theme`, Mulish, header e footer fiéis, layout responsivo      | —          |
| 2     | UC02 | `feat/uc02-listagem`       | Domínio, adapter AniList, card, grade, estados de carregamento/vazio/erro | UC01       |
| 3     | UC03 | `feat/uc03-detalhe`        | Modal de detalhe acessível                                                | UC02       |
| 4     | UC04 | `feat/uc04-filtro-formato` | Filtro multiformato com `format_in`                                       | UC02       |
| 5     | UC05 | `feat/uc05-busca-texto`    | Busca por texto combinada com os formatos                                 | UC04       |
| 6     | UC06 | `feat/uc06-ver-mais`       | "Ver mais" acumulando páginas + tamanho da página                         | UC02       |

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
- **Red:** `scoreTone` (49/50/80/81 e nulo); mapper (nulos, gêneros limitados a 3); repositório envia `page`/`perPage` e repassa o `signal`; `flattenUniqueById`; grade renderiza 12 cards dos fixtures; estados carregando, vazio e erro com "Tentar novamente".
- **Green:** camadas `domain` → `services` → `features` → `components`, com `useSuspenseInfiniteQuery` (TanStack Query) dentro do `use-catalog`, `Suspense` e Error Boundary com `QueryErrorResetBoundary`.
- **Refactor:** extrair `ScoreBadge` e `GenreChip`; garantir `img` com `width`/`height` e `loading="lazy"`.
- **Qualidade:** adequação funcional (regra da nota), confiabilidade (erro e retry), eficiência (lazy loading, sem CLS).
- **Prompt:** [UC02](prompts/UC02-listagem-de-animes.md).

### UC03 — Visualizar detalhe do anime listado

- **Retrieval:** `specs/card.md`, `tokens.json`, `manifest.json → notInDesign.detalhe`.
- **Red:** clicar no card abre `dialog` com título, capa, gêneros, nota, formato, episódios, ano e sinopse; Esc e botão fechar devolvem o foco ao card; `<title>` muda enquanto aberto.
- **Green:** `AnimeDetailDialog` com `<dialog>` nativo e metadados do React 19.
- **Refactor:** sanitizar a sinopse (pedir `description(asHtml: false)`), reaproveitar `ScoreBadge`.
- **Qualidade:** acessibilidade (foco, Esc, nome do diálogo), segurança (sem `dangerouslySetInnerHTML`).
- **Prompt:** [UC03](prompts/UC03-detalhe-do-anime.md).

### UC04 — Filtrar lista por um ou mais formatos

- **Retrieval:** `specs/filtros.md`, `tokens.json`; referência `filtros.png`.
- **Red:** reducer de filtros (`toggleFormat`, `clearFormats`), "All Formats" ativo sem seleção, `aria-pressed`, repositório envia `format_in`, nova chave de query recomeça na página 1.
- **Green:** `FormatFilter` + ações no `use-catalog` com `useTransition` (a lista anterior fica visível enquanto a nova chave carrega).
- **Refactor:** `FORMAT_OPTIONS` como única fonte de rótulos e valores.
- **Qualidade:** adequação funcional, usabilidade (estado visível e anunciado), eficiência (requisição cancelada ao trocar o filtro).
- **Prompt:** [UC04](prompts/UC04-filtro-por-formato.md).

### UC05 — Filtrar lista por busca de texto

- **Retrieval:** `specs/busca.md`, `tokens.json`; referência `busca.png`.
- **Red:** submit e Enter disparam a busca; texto vazio remove o filtro; busca combina com formatos; ordenação `SEARCH_MATCH` com texto e `POPULARITY_DESC` sem; estado vazio com o termo pesquisado.
- **Green:** `SearchBar` em `form role="search"` com input não controlado lido por `FormData` no `onSubmit` (não usar `<form action>`: o React 19 reseta o campo) + ação `search` no reducer de filtros.
- **Refactor:** normalizar o termo (trim) no domínio.
- **Qualidade:** adequação funcional, usabilidade (label acessível, feedback de vazio), eficiência (uma requisição por submit, com cancelamento da anterior).
- **Prompt:** [UC05](prompts/UC05-busca-por-texto.md).

### UC06 — Alterar tamanho de paginação usando "Ver mais"

- **Retrieval:** `specs/ver-mais.md`, `tokens.json`, `manifest.json → notInDesign.tamanho-pagina`; referência `ver-mais.png`; asset `public/icons/add.svg`.
- **Red:** "Ver mais" busca a página seguinte e mantém os itens; botão some sem `hasNextPage`; `aria-busy` durante o carregamento; foco vai para o primeiro card novo; seletor 12/24/48 reinicia a lista.
- **Green:** `LoadMoreButton`, `PageSizeSelect`; `loadMore` = `fetchNextPage` com `getNextPageParam`; `setPerPage` no reducer de filtros (nova chave).
- **Refactor:** garantir que a deduplicação fique só em `flattenUniqueById` (via `select`).
- **Qualidade:** eficiência (sem refazer páginas já carregadas), acessibilidade (foco e anúncio), confiabilidade (erro na página seguinte não apaga as anteriores: `isFetchNextPageError`).
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

| Tema                      | Proposta do plano                                                                                                  | Precisa de confirmação |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| Contraste do "Ver mais"   | Branco sobre `#FFB800` tem ≈ 1,7:1; usar texto e ícone `primary` (≈ 4,6:1)                                         | Sim                    |
| Contraste do chip de nota | `#E2E5E9` sobre `#01ADA6` tem ≈ 2,2:1; avaliar texto `white` em negrito                                            | Sim                    |
| Tamanho da página (RF07)  | Seletor 12/24/48 ao lado do "Ver mais", padrão 12 (3 linhas × 4)                                                   | Sim                    |
| Título exibido            | `title.romaji` (igual ao design), `english` no detalhe                                                             | Não                    |
| Dados, UI e formulário    | TanStack Query; sem shadcn; sem React Hook Form ([ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md)) | Não (decidido)         |
