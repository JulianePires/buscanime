# Prompt — UC08 Carregar o detalhe do anime sob demanda

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito e respeite a fronteira de dados do ADR-003: componentes não conhecem o Apollo nem os tipos gerados.
</papel>

<objetivo>
Separar a consulta do modal da consulta da listagem: a listagem pede só os campos do card e o detalhe busca o restante por id quando o modal abre, sem atrasar a abertura e sem derrubar a listagem em caso de erro.
</objetivo>

<retrieval>
1. docs/adr/ADR-004-consulta-propria-para-o-detalhe.md (a decisão e as peças, leitura obrigatória)
2. docs/adr/ADR-003-apollo-client-como-camada-de-dados.md (cache, facade, erros, retry por queryKey)
3. docs/USE_CASES.md (UC08 e UC03), docs/REQUISITOS.md (RF05, RNF02, RNF06)
4. docs/prompts/UC03-detalhe-do-anime.md e UC07-layout-estavel.md (decisões do modal que continuam valendo)
5. Código existente: src/services/anilist/{queries/page.graphql.ts, mappers.ts, cache.ts, prefetch.ts}, src/domain/anime.ts, src/features/catalog/{use-catalog.ts, CatalogResults.tsx}, src/components/anime/{AnimeGrid,AnimeCard,AnimeDetailDialog}.tsx (+ testes), src/components/feedback/{ErrorBoundary,LoadingState}.tsx, src/test/apollo.tsx, src/test/msw/*
6. Apollo: useSuspenseQuery (queryKey) e normalização do cache
</retrieval>

<restricoes>
- ANIME_PAGE fica só com os campos do card: id, title { romaji english }, coverImage { extraLarge color }, genres, averageScore.
- Nova operação ANIME_DETAIL (AnimeDetail) em src/services/anilist/queries/detail.graphql.ts: Media(id: $id, type: ANIME) com todos os campos do modal, inclusive os do card. Depois, pnpm codegen.
- Domínio: Anime vira o resumo do card; AnimeDetail extends Anime com englishTitle, format, description, episodes, seasonYear, status e siteUrl. Mappers: toAnime e toAnimeDetail; toDescription só no detalhe.
- Facade: useAnimeDetail(id, attempt) em src/features/anime-detail/use-anime-detail.ts, com useSuspenseQuery e queryKey ["anime-detail", id, attempt]. cache-first: reabrir o mesmo anime não vai à rede.
- Nenhuma typePolicy nova: o Media já normaliza por id.
- Abertura: o modal abre na hora com o Anime do card (título, capa, gêneros, nota e <title>). Só o corpo (fatos, sinopse, link) suspende, dentro de um Suspense e de um ErrorBoundary próprios do modal.
- Erro: "Tentar novamente" dentro do modal, com a tentativa no componente que envolve o boundary. A listagem continua visível e "Fechar", Esc e overlay seguem funcionando. Sem reenvio automático.
- Composição: AnimeDetailDialog continua de apresentação (Anime + children). O AnimeDetail de src/features/anime-detail junta diálogo, Suspense, boundary e facade. O AnimeGrid recebe renderDetail(anime, onClose) do CatalogResults; componentes não importam de features.
- prefetch.ts não muda: ele imprime a ANIME_PAGE no build. Ajuste só os testes que conferem a query impressa.
- Anti-objetivos: sem pré-carregar no hover/foco (adiado no ADR-004), sem rota ou link direto, sem returnPartialData, sem mudar o visual do modal (720 px, padding 24 no wrapper interno, overlay do UC07).
</restricoes>

<criterios_bdd>
Dado que a listagem de animes foi carregada
Quando a consulta da listagem for enviada
Então ela deve pedir apenas os campos exibidos no card

Dado que a listagem contém um anime
Quando o visitante abrir o detalhe desse anime
Então o modal deve abrir imediatamente com o título, a capa, os gêneros e a nota do card
E os dados complementares devem ser buscados em uma consulta própria pelo id do anime
E um estado de carregamento deve ocupar o lugar dos dados complementares até a resposta chegar

Dado que o detalhe de um anime já foi aberto
Quando o visitante fechar e abrir de novo o detalhe do mesmo anime
Então os dados complementares devem aparecer sem nova consulta

Dado que a consulta do detalhe falhou
Quando o modal for exibido
Então deve mostrar uma mensagem de erro com a opção "Tentar novamente" dentro do modal
E a listagem deve continuar visível e inalterada
E ao acionar "Tentar novamente" a consulta do detalhe deve ser refeita
</criterios_bdd>

<plano_tdd>
1. queries: ANIME_PAGE não seleciona description, episodes, seasonYear, status, siteUrl nem format; ANIME_DETAIL seleciona Media(id) com todos os campos do modal.
2. mappers.test.ts: toAnime mapeia só o resumo; toAnimeDetail mapeia o detalhe (sinopse sem HTML, englishTitle só quando difere, formato e status desconhecidos viram null).
3. use-anime-detail.test.tsx (MSW + createTestApolloClient): envia AnimeDetail com o id; segunda leitura do mesmo id não chama o handler; attempt novo refaz a consulta.
4. AnimeDetailDialog.test.tsx: renderiza o cabeçalho a partir do Anime e o corpo vindo de children; os testes de overlay e fechamento do UC07 continuam verdes.
5. features/anime-detail/AnimeDetail.test.tsx: mostra o cabeçalho e o carregamento antes da resposta; depois mostra fatos e sinopse; com erro, mostra "Tentar novamente" e refaz a consulta.
6. App.test.tsx (renderWithCatalog): o bloco do UC03 passa a esperar a sinopse depois da resposta do detalhe; erro no detalhe mantém os cards na tela; foco volta ao card ao fechar.
7. prefetch.test.ts: a query impressa não contém description.
8. e2e/detail.spec.ts: conta as requisições AnimeDetail (uma na primeira abertura, nenhuma ao reabrir) e confere que a resposta da listagem não traz description.
</plano_tdd>

<design>
- O modal não muda: superfície branca, raio 8, largura máxima 720, padding 24 no wrapper interno, backdrop rgba(0,0,0,.6).
- Carregamento: blocos no lugar dos fatos e da sinopse, com as mesmas cores do LoadingState (RNF06), sem mudar a altura do cabeçalho.
- Erro: texto e botão no padrão do ErrorBoundary da listagem.
</design>

<arquivos>
src/services/anilist/queries/{page,detail}.graphql.ts, src/services/anilist/mappers.ts (+ teste), src/domain/anime.ts,
src/features/anime-detail/{use-anime-detail.ts, AnimeDetail.tsx} (+ testes), src/features/catalog/CatalogResults.tsx,
src/components/anime/{AnimeGrid,AnimeDetailDialog}.tsx (+ testes), src/test/msw/handlers.ts, src/App.test.tsx,
src/services/anilist/prefetch.test.ts, e2e/detail.spec.ts, docs/AI_LOG.md, docs/CHANGELOG.md.
</arquivos>

<verificacao>
pnpm codegen && pnpm validate && pnpm test:e2e && pnpm lighthouse:ci. Medir antes e depois o tamanho da resposta da primeira página (12 itens) e o LCP com throttling real (--throttling-method=devtools, 3 execuções), e registrar no AI_LOG.md (Decisões).
</verificacao>

<saida>
(1) Resumo; (2) decisões e divergências em relação ao ADR-004; (3) resultados e medições; (4) commit convencional (ex.: "feat: fetch anime detail on demand (uc08)"); (5) entrada para docs/AI_LOG.md.
</saida>
```
