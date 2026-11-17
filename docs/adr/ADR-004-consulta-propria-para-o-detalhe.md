# ADR-004 — Consulta própria para o detalhe do anime

- **Status:** aceita
- **Data:** 2026-11-17
- **Altera:** a parte do [ADR-003](ADR-003-apollo-client-como-camada-de-dados.md) em que o detalhe (UC03) lê o `Media:<id>` que a listagem já trouxe, sem requisição. O restante do ADR-003 (Apollo Client 4, Codegen, cache normalizado, facade, fronteira de lint) continua valendo.
- **Caso de uso:** [UC08](../USE_CASES.md#uc08--carregar-o-detalhe-do-anime-sob-demanda). Prompt: [UC08](../prompts/UC08-consulta-do-detalhe.md).

## Contexto

Desde o UC03, a `ANIME_PAGE` pede todos os campos do modal para todos os itens de todas as páginas, para que abrir o detalhe leia o cache sem rede. Na revisão, quatro pontos pesaram contra:

- **O card usa só uma parte dos campos.** Ele mostra título, capa, cor da capa, gêneros e nota. `format`, `description`, `episodes`, `seasonYear`, `status` e `siteUrl` só aparecem no modal. A `description` é o campo mais pesado da resposta (sinopses de centenas a milhares de caracteres) e vem em todos os cards, mesmo que o visitante abra poucos detalhes ou nenhum.
- **A primeira página está no caminho crítico do LCP.** Ela é pedida pelo script inline do `index.html` antes do bundle (`prefetch.ts`). Cada campo que só o modal usa aumenta a resposta que a página espera para mostrar a primeira capa.
- **Listagem e detalhe evoluem em ritmos diferentes.** Um campo novo no detalhe (estúdios, trailer, banner) entraria na `ANIME_PAGE` e pesaria em toda página e em todo "Ver mais". Hoje o mesmo tipo de domínio (`Anime`) e o mesmo mapper servem as duas telas.
- **O detalhe depende de a listagem ter carregado o anime.** Ele não funciona sozinho. Um link direto para um anime (fora do escopo atual) exigiria outra consulta de qualquer forma.

O preço de separar é uma requisição a mais na primeira vez que cada anime é aberto.

## Decisão

Separar as consultas: **a listagem pede só o que o card mostra, e o modal faz a própria consulta (`AnimeDetail`), por id, quando abre**. As duas continuam no mesmo cache normalizado do Apollo.

| Peça                  | Implementação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta da listagem  | `ANIME_PAGE` fica com `id`, `title { romaji english }`, `coverImage { extraLarge color }`, `genres` e `averageScore`. O `title.english` continua porque é o título de reserva do card.                                                                                                                                                                                                                                                                                                            |
| Consulta do detalhe   | `ANIME_DETAIL` (operação `AnimeDetail`) em `src/services/anilist/queries/detail.graphql.ts`: `Media(id: $id, type: ANIME)` com **todos** os campos que o modal mostra, inclusive os que o card já tem. Assim ela é autossuficiente e não depende do que está no cache. Tipada com `TypedDocumentNode<AnimeDetailQuery, AnimeDetailQueryVariables>`.                                                                                                                                               |
| Domínio               | `Anime` passa a ser o resumo do card, com `englishTitle` (a listagem já traz o `title.english`, e assim o cabeçalho do modal aparece completo na hora). `AnimeDetail extends Anime` acrescenta `format`, `description`, `episodes`, `seasonYear`, `status` e `siteUrl`.                                                                                                                                                                                                                           |
| Mappers               | `toAnime` (card) e `toAnimeDetail` (modal) em `mappers.ts`, que continua sendo a única camada que conhece os tipos gerados. A limpeza da sinopse (`toDescription`) passa a ser usada só por `toAnimeDetail`.                                                                                                                                                                                                                                                                                      |
| Cache                 | Nenhuma `typePolicy` nova. O `Media` já normaliza por `id`: a resposta do detalhe acrescenta campos ao mesmo `Media:<id>` e o campo raiz `Media({"id":…,"type":"ANIME"})` fica guardado. Reabrir o mesmo anime é `cache-first` e não vai à rede. Uma página nova da listagem que traga o mesmo anime não apaga os campos do detalhe, porque o Apollo mescla os campos da entidade.                                                                                                                |
| Facade                | `useAnimeDetail(id, attempt)` em `src/features/anime-detail/use-anime-detail.ts`, com `useSuspenseQuery(ANIME_DETAIL, { variables: { id }, queryKey: ["anime-detail", attempt] })` (o Apollo soma o `queryKey` à query e às variáveis, então o `id` já diferencia os animes). Devolve só `AnimeDetail`; se o AniList não encontra o id, lança `AnimeNotFoundError` para o boundary. É um hook irmão da `use-catalog`, como o prompt do UC03 já previa.                                            |
| Abertura do modal     | O modal abre na hora com o que o card já tem (título, capa, gêneros, nota) e com o `<title>` da aba. Só o corpo complementar (fatos, sinopse, link do AniList) suspende. O clique nunca parece travado.                                                                                                                                                                                                                                                                                           |
| Carregamento          | `Suspense` próprio dentro do modal, com um esqueleto (`AnimeDetailSkeleton`, `role="status"`, "Carregando detalhes") no lugar dos fatos e da sinopse (RNF06) e `aria-busy` na região. O `Suspense` da listagem não é acionado.                                                                                                                                                                                                                                                                    |
| Erro                  | `ErrorBoundary` próprio dentro do modal (o componente de `src/components/feedback` já existente, que ganhou a prop `message`: "Não foi possível carregar os detalhes.") com "Tentar novamente". A tentativa fica no componente que envolve o boundary e entra no `queryKey`, como no `useCatalogRetry`: nasce uma referência nova e a requisição é refeita. A listagem e o foco não são afetados; "Fechar", Esc e overlay continuam funcionando.                                                  |
| Composição            | `AnimeDetailDialog` (em `components/`) continua só de apresentação: recebe o `Anime` do card e o corpo como `children`. Fatos, sinopse e link saíram para `AnimeDetailInfo` (também de apresentação, recebe `AnimeDetail`). O componente `AnimeDetail` (em `features/anime-detail/`) junta diálogo, `Suspense`, boundary e facade. O `AnimeGrid` recebe o componente pela prop `detail` (`ComponentType<{ anime, onClose }>`) do `CatalogResults`, porque componentes não importam de `features`. |
| Transporte e prefetch | Sem mudança de mecanismo. A consulta do detalhe usa o mesmo client (`formEncoded`, sem preflight). O script do `index.html` imprime a `ANIME_PAGE` no build, então passa a pedir só os campos do card sem nenhuma alteração no `prefetch.ts`.                                                                                                                                                                                                                                                     |
| Fronteira             | Sem mudança: o Apollo só é importado em `src/services` e `src/features`, e a regra de lint continua cobrindo o novo hook.                                                                                                                                                                                                                                                                                                                                                                         |

### Ajustes em relação ao prompt UC08

| Ponto do prompt                               | O que foi feito e por quê                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `englishTitle` em `AnimeDetail`               | Ficou no `Anime`. A listagem já traz o `title.english` (reserva do título do card), então o título em inglês aparece no cabeçalho do modal sem esperar a consulta do detalhe.                                                                                                                               |
| `renderDetail(anime, onClose)` no `AnimeGrid` | Virou a prop `detail` com um componente. A regra `react-hooks/refs` do React Compiler reprova chamar, durante o render, uma função que recebe o `closeDetail` (que lê o ref do card para devolver o foco). Passar o `closeDetail` como prop de um componente é permitido. A separação de camadas é a mesma. |
| `queryKey: ["anime-detail", id, attempt]`     | Ficou `["anime-detail", attempt]`: o Apollo já combina o `queryKey` com a query e as variáveis.                                                                                                                                                                                                             |
| Testes de fatos, sinopse e link no diálogo    | Foram para `AnimeDetailInfo.test.tsx`, junto com o componente. O `AnimeDetailDialog.test.tsx` cobre o cabeçalho, o `children` e os fechamentos (Esc, "Fechar" e overlay do UC07).                                                                                                                           |

## Alternativas consideradas

| Alternativa                                                         | Motivo da rejeição                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manter os campos do detalhe na `ANIME_PAGE` (decisão do ADR-003)    | Deixa o detalhe sem requisição, mas cobra a sinopse de todos os cards, inclusive na primeira página, que está no caminho do LCP. Cada campo novo do modal pesaria em toda a listagem.                                 |
| `@defer` nos campos do detalhe                                      | O schema do AniList não declara a diretiva `@defer`. Mesmo com ela, os campos continuariam vindo para todos os itens da página, só que mais tarde.                                                                    |
| Abrir o modal só quando a resposta chegar                           | O clique ficaria sem resposta visível durante a requisição. Mostrar o que o card já tem é imediato e não custa nada.                                                                                                  |
| Montar o cabeçalho com `returnPartialData` lendo o cache            | Funcionaria, mas faria o modal depender do estado do cache e de configuração extra no Apollo. Passar o `Anime` do card por prop é explícito e fácil de testar.                                                        |
| Pré-carregar o detalhe no `pointerenter`/foco do card               | Adiado. Reduziria a espera, mas dispararia requisições para cards que o visitante só atravessou com o mouse, e o AniList limita requisições por minuto. Pode voltar com `preloadQuery` se a espera medida justificar. |
| Uma `ANIME_PAGE` com fragmento compartilhado para os campos do card | Não resolve o problema, porque a listagem continuaria pedindo os campos do detalhe. Um fragmento do card pode ser útil depois, mas não muda a decisão.                                                                |

## Consequências

**Positivas**

- Resposta da listagem menor em toda página, inclusive na primeira, pedida antes do bundle. Medido em 17/11/2026 contra o AniList real (12 itens, `POPULARITY_DESC`): de **14.884 para 3.661 bytes** (−75%), ou de 5.833 para 984 bytes com gzip (−83%). O LCP com throttling real ainda não foi medido (detalhes no `AI_LOG.md`, Decisões).
- O detalhe evolui sem mexer na listagem: campos novos entram só na `ANIME_DETAIL`.
- O detalhe é autossuficiente (busca por id) e deixa um link direto para um anime viável no futuro, sem refazer a camada de dados.
- Uma falha no detalhe fica dentro do modal e não derruba a listagem.
- Os tipos ficam mais honestos: o card não recebe campos que não usa.

**Negativas e mitigação**

- **Uma requisição a mais por anime aberto pela primeira vez.** Ela custa 1.295 bytes (790 com gzip) e levou de 0,35 a 0,82 s nas medições de 17/11/2026. Mitigação: o modal abre na hora com os dados do card, o restante tem esqueleto, e reabrir o mesmo anime vem do cache, sem rede (há teste contando as chamadas).
- **Espera visível na sinopse com rede lenta.** Mitigação: o esqueleto reserva o espaço (sem CLS dentro do modal). Se a espera medida incomodar, o pré-carregamento por intenção (alternativa adiada) é o próximo passo.
- **Mais requisições contra o limite do AniList.** São requisições disparadas por clique, uma por anime, e o cache evita repetições. Não há reenvio automático (vale a regra do ADR-003).
- **Mais código.** São uma operação, um hook, um mapper, um tipo de domínio e os testes de cada um. O `AnimeGrid` ganha um parâmetro (`detail`), e o corpo do modal virou dois componentes (`AnimeDetailInfo` e `AnimeDetailSkeleton`).
- **A consequência "o UC03 lê da listagem sem nova requisição" do ADR-003 deixa de valer.** O ADR-003 recebeu uma nota apontando para este ADR.

## Referências

- [ADR-003](ADR-003-apollo-client-como-camada-de-dados.md), cache normalizado, facade e regra de erros.
- [UC03](../prompts/UC03-detalhe-do-anime.md), decisões do modal (`<dialog>`, foco, `<title>`, sinopse sem HTML).
- Apollo, [Suspense](https://www.apollographql.com/docs/react/data/suspense) (`useSuspenseQuery`, `queryKey`, `preloadQuery`) e [Caching overview](https://www.apollographql.com/docs/react/caching/overview) (normalização e mescla de campos da entidade).
- AniList, [GraphQL API](https://docs.anilist.co) (`Media(id:)`, limite de requisições).
