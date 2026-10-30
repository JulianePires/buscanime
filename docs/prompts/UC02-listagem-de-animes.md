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
3. docs/PLANO-IMPLEMENTACAO.md (arquitetura alvo e padrões)
4. docs/design-context/manifest.json (seção "card" e notInDesign "estados")
5. docs/design-context/specs/card.md e specs/layout.md (grade)
6. docs/design-context/tokens.json e fixtures/figma-cards.json
7. Alvo visual: docs/design-context/references/card.png e desktop-frame.png
Fonte da API: https://docs.anilist.co (endpoint https://graphql.anilist.co).
</retrieval>

<restricoes>
- Domínio puro em src/domain/ (anime.ts, score.ts). scoreTone usa tabela de faixas, sem if aninhado.
- Adapter em src/services/anilist/: client.ts (fetch POST com AbortSignal e AniListError), queries.ts, mappers.ts, anime-repository.ts com a interface AnimeRepository { searchPage(params, signal): Promise<AnimePage> }.
- Estado em src/features/catalog/: reducer puro só para filtros (catalog-filters-reducer.ts) e páginas com @tanstack/react-query (useSuspenseInfiniteQuery, chave ['animes', params], queryFn chama o repositório repassando signal). Hook facade use-catalog esconde o Query dos componentes; CatalogProvider injeta QueryClient e repositório (testes usam fakes). Ver docs/adr/ADR-002.
- Leitura com Suspense; erros com Error Boundary + QueryErrorResetBoundary e ação "Tentar novamente". Nos testes, createTestQueryClient() com retry: false.
- Sem shadcn/ui: componentes próprios sobre elementos nativos.
- Instale @tanstack/react-query como dependency. Testes de integração com msw (instale como devDependency); nunca chamar a API real nos testes.
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
2. src/services/anilist/mappers.test.ts: DTO completo → Anime; averageScore null; genres limitado a 3; title.romaji com fallback para english.
3. src/services/anilist/anime-repository.test.ts (msw): envia page=1, perPage=12, type=ANIME, sort=POPULARITY_DESC; propaga AniListError em HTTP 500 e em "errors" do GraphQL.
4. src/domain/pagination.test.ts: flattenUniqueById achata páginas, remove ids repetidos e preserva a ordem; src/features/catalog/catalog-filters-reducer.test.ts: estado inicial (sem formatos, sem termo, perPage 12).
5. src/components/anime/AnimeCard.test.tsx: título (heading), até 3 chips, nota "80%" com classe/variável do tom esperado, img com alt vazio, width/height e loading="lazy".
6. src/App.test.tsx (msw): skeleton/loading → 12 itens de lista; vazio; erro + "Tentar novamente" refaz a requisição.
7. e2e/home.spec.ts: com page.route mockando graphql.anilist.co, 12 cards visíveis e grade de 4 colunas em 1366 px.
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
src/domain/{anime,score}.ts (+ testes), src/services/anilist/* (+ testes), src/features/catalog/* (+ testes),
src/components/anime/{AnimeCard,AnimeGrid,ScoreBadge,GenreChip}.tsx (+ testes),
src/components/feedback/{LoadingState,EmptyState,ErrorState}.tsx, src/test/msw/*, src/test/fixtures/*, src/App.tsx, e2e/home.spec.ts.
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
