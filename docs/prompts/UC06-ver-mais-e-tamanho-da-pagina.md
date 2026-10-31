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
7. Código existente: src/features/catalog/use-catalog.ts, src/services/anilist/cache.ts, src/domain/*
8. docs/adr/ADR-003-apollo-client-como-camada-de-dados.md (paginação por typePolicies)
</retrieval>

<restricoes>
- loadMore, isLoadingMore e hasNextPage já vêm da facade: fetchMore({ page: currentPage + 1 }) em useTransition, e o merge de Page.media (cache.ts) acumula e deduplica por id. Não duplique a deduplicação na UI.
- setPerPage(n) já existe na facade: perPage entra na chave do cache, então a lista recomeça na página 1, e voltar a um tamanho já visto vem do cache.
- Hoje um erro no fetchMore sobe para o Error Boundary e esconde a lista. Neste UC, a facade deve capturá-lo e expor loadMoreError (com teste antes), mantendo as páginas anteriores e mostrando "Tentar novamente" junto ao botão.
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
1. Acúmulo, deduplicação, pageInfo da última página e hasNextPage já estão cobertos no SETUP-01 (cache.test.ts, use-catalog.test.tsx).
2. use-catalog.test.tsx (msw): erro na página seguinte preserva os itens e expõe loadMoreError; tentar de novo carrega a página.
3. LoadMoreButton.test.tsx: nome "Ver mais"; aria-busy e disabled durante o carregamento; oculto sem hasNextPage.
4. App.test.tsx (msw + renderWithCatalog + clickAndWait): 12 → clique → 24 itens; foco no 13º card; última página esconde o botão; trocar para 24 recarrega com 24.
5. e2e: clicar em "Ver mais" e verificar que a URL não muda e os primeiros cards continuam no DOM.
</plano_tdd>

<design>
- Botão: largura total do conteúdo (até 1316), altura 48, fundo #FFB800, raio 8.
- Conteúdo centralizado: ícone 30 × 24 + "Ver mais" Mulish SemiBold 20, gap ≈ 12.
- Cor do texto/ícone: o Figma usa branco (contraste ≈ 1,7:1). Siga a decisão registrada em PLANO-IMPLEMENTACAO.md; se ainda estiver em aberto, implemente o branco do design, registre a divergência de acessibilidade e sinalize no relatório.
- Seletor de tamanho: altura 38, borda 1 px #C4CAD4, raio 4, Mulish Regular 14, alinhado à direita acima do botão.
</design>

<arquivos>
src/features/catalog/use-catalog.ts (+ teste, loadMoreError),
src/components/pagination/{LoadMoreButton,PageSizeSelect}.tsx (+ testes), src/components/anime/AnimeGrid.tsx, src/App.tsx, e2e/load-more.spec.ts.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e && pnpm lighthouse:ci. Compare com references/ver-mais.png.
</verificacao>

<saida>
(1) Resumo; (2) divergências do Figma (contraste, seletor ausente no design); (3) resultados; (4) commit convencional (ex.: "feat: load more animes and set page size"); (5) entrada para docs/AI_LOG.md.
</saida>
```
