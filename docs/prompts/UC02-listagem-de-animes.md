# Prompt — UC02 Visualizar listagem de animes

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito e em camadas (domínio → serviço → feature → apresentação), aplicando SOLID.
</papel>

<objetivo>
Listar a primeira página de animes do AniList em cards fiéis ao Figma, com a nota colorida pela regra de negócio e estados explícitos de carregamento, vazio e erro.
</objetivo>

<retrieval>
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md
2. docs/USE_CASES.md (UC02), docs/REQUISITOS.md (RF02, RNF02, RNF06), docs/DESIGN.md (cor da nota)
3. docs/PLANO-IMPLEMENTACAO.md (arquitetura alvo e padrões) e docs/adr/ADR-003-apollo-client-como-camada-de-dados.md (camada de dados)
4. docs/design-context/manifest.json (seção "card" e notInDesign "estados")
5. docs/design-context/specs/card.md e specs/layout.md (grade)
6. docs/design-context/tokens.json e fixtures/figma-cards.json
7. Alvo visual: docs/design-context/references/card.png e desktop-frame.png
Fonte da API: https://docs.anilist.co (endpoint https://graphql.anilist.co).
8. Código existente (SETUP-01): src/features/catalog/use-catalog.ts, src/components/feedback/ErrorBoundary.tsx, src/test/apollo.tsx, src/test/msw/*
</retrieval>

<restricoes>
- Domínio puro em src/domain/ (anime.ts já existe; criar score.ts). scoreTone usa tabela de faixas, sem if aninhado.
- A camada de dados já existe (SETUP-01, ADR-003): Apollo Client 4, cache, mappers e a facade useCatalog(). Componentes leem { animes, hasNextPage, ... } de useCatalog() e nunca importam @apollo/client (o ESLint bloqueia) nem tipos gerados.
- Leitura com Suspense; erros com <ErrorBoundary onReset={useCatalogRetry()}> e ação "Tentar novamente". Nos testes, renderWithCatalog() e clickAndWait() de src/test/apollo.tsx (act assíncrono, exigido pelo Suspense no React 19) e createTestApolloClient() com cache novo por teste.
- Sem shadcn/ui: componentes próprios sobre elementos nativos.
- Não instale dependências de dados: Apollo, Codegen e msw já estão no projeto. Testes de integração com msw (anilist.query("AnimePage", ...) de src/test/msw/handlers.ts); nunca chamar a API real nos testes.
- Capas vêm de coverImage.extraLarge; não adicionar imagens do Figma ao repositório.
- Anti-objetivos: sem filtros, busca, detalhe ou "Ver mais" (outros UCs).
</restricoes>

<criterios_bdd>
Dado que existem animes disponíveis
Quando o visitante acessar a área de listagem
Então deve visualizar os animes em cards ou itens identificáveis

Dado que um anime listado possui nota média
Quando o card desse anime for exibido
Então a nota deve aparecer em percentual
E deve usar a cor de perigo se for menor que 50
E deve usar a cor de alerta se estiver entre 50 e 80, inclusive
E deve usar a cor de sucesso se for maior que 80

Dado que a API não retornou animes
Quando a listagem terminar de carregar
Então deve exibir uma mensagem de lista vazia

Dado que a API falhou
Quando a listagem tentar carregar
Então deve exibir uma mensagem de erro com a opção de tentar novamente
</criterios_bdd>

<plano_tdd>
1. src/domain/score.test.ts: 0, 49 → danger; 50, 80 → warning; 81, 100 → success; null → undefined. Use test.each com os fixtures (expectedColor).
2. Mapper, variáveis (page=1, perPage=12, sort=POPULARITY_DESC), erros (CombinedGraphQLErrors, ServerError) e reducer já estão cobertos pelo SETUP-01; acrescente casos só se o card precisar de um campo novo (e então rode pnpm codegen).
3. src/components/anime/AnimeCard.test.tsx: título (heading), até 3 chips, nota "80%" com classe/variável do tom esperado, img com alt vazio, width/height e loading="lazy".
4. src/App.test.tsx (msw + renderWithCatalog): skeleton/loading → 12 itens de lista; vazio; erro + "Tentar novamente" refaz a requisição.
5. e2e/home.spec.ts: com page.route mockando graphql.anilist.co, 12 cards visíveis e grade de 4 colunas em 1366 px.
</plano_tdd>

<design>
- Card 317 × 270 (aspect-ratio 317 / 270), raio 8, capa object-fit cover, overlay linear-gradient(180deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.17) 105%).
- Conteúdo: left 28, top 23, largura 261, gap 11. Título Mulish Bold 24 branco, line-clamp 3.
- Chips: fundo #774DC5, texto #E2E5E9 Regular 12, padding 3 × 8, raio 4, gap 11.
- Nota: canto inferior direito (8 px), Regular 24, padding 3 × 8, raio 4, fundo pelo tom (danger #E92151, warning #FFB800, success #01ADA6).
- Grade: 4 colunas no desktop, gap 21 × 16; responsiva com repeat(auto-fill, minmax(min(100%, 280px), 1fr)).
- Query GraphQL mínima: Page(page, perPage) { pageInfo { hasNextPage currentPage } media(type: ANIME, sort: $sort) { id title { romaji english } coverImage { extraLarge color } genres averageScore format } }.
</design>

<arquivos>
src/domain/score.ts (+ teste), src/test/fixtures/* (reaproveitar anime-page.ts),
src/components/anime/{AnimeCard,AnimeGrid,ScoreBadge,GenreChip}.tsx (+ testes),
src/components/feedback/{LoadingState,EmptyState}.tsx (o erro usa o ErrorBoundary existente), src/App.tsx, e2e/home.spec.ts.
Se passar de 30 arquivos, divida em commits: domínio+serviço, feature+componentes, e2e+docs.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e && pnpm lighthouse:ci
Confirme: nenhuma URL figma.com no código; CLS 0 no Lighthouse; nota 80 em amarelo.
</verificacao>

<saida>
(1) Resumo; (2) divergências do Figma (inclua a nota 80 e o contraste do chip de nota); (3) resultados dos comandos; (4) mensagens de commit convencionais; (5) entrada para docs/AI_LOG.md.
</saida>
```
