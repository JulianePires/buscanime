# Prompt — UC06 Alterar tamanho de paginação usando "Ver mais"

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito; paginação como transformação pura de estado.
</papel>

<objetivo>
Carregar a próxima página pelo botão "Ver mais" sem recarregar a tela e mantendo os itens exibidos, e permitir escolher quantos itens vêm por página.
</objetivo>

<retrieval>
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md
2. docs/USE_CASES.md (UC06), docs/REQUISITOS.md (RF06, RF07, RNF01, RNF06)
3. docs/PLANO-IMPLEMENTACAO.md (decisões em aberto: contraste e seletor de tamanho)
4. docs/design-context/manifest.json (seção "ver-mais" e notInDesign "tamanho-pagina")
5. docs/design-context/specs/ver-mais.md e tokens.json
6. Alvo visual: docs/design-context/references/ver-mais.png; asset public/icons/add.svg
7. Código existente: src/features/catalog/*, src/domain/*
</retrieval>

<restricoes>
- loadMore = fetchNextPage do useSuspenseInfiniteQuery; getNextPageParam devolve currentPage + 1 quando hasNextPage, senão undefined. Deduplicação só em flattenUniqueById (src/domain/pagination.ts), usada no select.
- Reducer de filtros: setPerPage(n) gera nova queryKey e reinicia a lista; filtros/busca idem.
- Erro ao carregar a página seguinte (isFetchNextPageError) mantém as páginas anteriores e mostra "Tentar novamente" junto ao botão.
- Foco: após carregar, mover o foco para o primeiro card novo usando ref como prop (React 19).
- Ícone: <img src="/icons/add.svg" alt="" width="30" height="24">, sem redesenhar nem alterar dimensões.
- Seletor de tamanho (RF07, ausente no Figma): <select> rotulado "Itens por página" com 12, 24 e 48; padrão 12.
- Anti-objetivos: sem scroll infinito, sem IntersectionObserver.
</restricoes>

<criterios_bdd>
Dado que a primeira página de animes foi carregada
Quando o visitante acionar o botão "Ver mais" ao final da listagem
Então o sistema deve carregar a próxima página sem recarregar a tela
E deve manter os animes já exibidos

Dado que não há mais páginas
Quando a última página for carregada
Então o botão "Ver mais" não deve ser exibido

Dado que o visitante alterou a quantidade de itens por página
Quando a listagem for recarregada
Então deve exibir a primeira página com a nova quantidade
</criterios_bdd>

<plano_tdd>
1. catalog-query.test.ts: getNextPageParam (hasNextPage true → currentPage + 1; false → undefined).
2. catalog-filters-reducer.test.ts: setPerPage altera perPage e a queryKey; use-catalog (msw): erro na página seguinte preserva itens.
3. anime-repository.test.ts (msw): page=2 com os mesmos filtros e perPage.
4. LoadMoreButton.test.tsx: nome "Ver mais"; aria-busy e disabled durante o carregamento; oculto sem hasNextPage.
5. App.test.tsx (msw): 12 → clique → 24 itens; foco no 13º card; última página esconde o botão; trocar para 24 recarrega com 24.
6. e2e: clicar em "Ver mais" e verificar que a URL não muda e os primeiros cards continuam no DOM.
</plano_tdd>

<design>
- Botão: largura total do conteúdo (até 1316), altura 48, fundo #FFB800, raio 8.
- Conteúdo centralizado: ícone 30 × 24 + "Ver mais" Mulish SemiBold 20, gap ≈ 12.
- Cor do texto/ícone: o Figma usa branco (contraste ≈ 1,7:1). Siga a decisão registrada em PLANO-IMPLEMENTACAO.md; se ainda estiver em aberto, implemente o branco do design, registre a divergência de acessibilidade e sinalize no relatório.
- Seletor de tamanho: altura 38, borda 1 px #C4CAD4, raio 4, Mulish Regular 14, alinhado à direita acima do botão.
</design>

<arquivos>
src/domain/pagination.ts (+ teste), src/features/catalog/* (+ testes), src/services/anilist/anime-repository.ts (+ teste),
src/components/pagination/{LoadMoreButton,PageSizeSelect}.tsx (+ testes), src/components/anime/AnimeGrid.tsx, src/App.tsx, e2e/load-more.spec.ts.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e && pnpm lighthouse:ci. Compare com references/ver-mais.png.
</verificacao>

<saida>
(1) Resumo; (2) divergências do Figma (contraste, seletor ausente no design); (3) resultados; (4) commit convencional (ex.: "feat: load more animes and set page size"); (5) entrada para docs/AI_LOG.md.
</saida>
```
