# Prompt — UC09 Compartilhar e restaurar os filtros pela URL

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito, reaproveitando o reducer de filtros do catálogo e sem biblioteca de rotas.
</papel>

<objetivo>
Levar o texto buscado e os formatos selecionados para os query params, abrir um link já filtrado, restaurar os filtros no voltar/avançar do navegador e remover o debounce da digitação, para que o botão "Buscar" volte a ser o gatilho da busca.
</objetivo>

<retrieval>
1. docs/USE_CASES.md (UC09, UC04, UC05), docs/REQUISITOS.md (RF03, RF04, RF09, RNF02)
2. docs/prompts/UC05-busca-por-texto.md (campo não controlado, uma requisição por intenção)
3. docs/design-context/specs/busca.md
4. Código existente: src/features/catalog/{CatalogProvider.tsx, catalog-filters-reducer.ts, use-viewport-page-size.ts}, src/components/filters/SearchBar.tsx (+ testes), src/services/anilist/prefetch.ts (+ teste), src/App.search.test.tsx, e2e/search.spec.ts, e2e/support/anilist.ts
</retrieval>

<restricoes>
- Parâmetros: q (termo normalizado) e format repetido, na ordem da seleção (ex.: /?q=one+piece&format=TV&format=MOVIE). perPage não entra: depende da largura de quem abre o link. Outros parâmetros (utm etc.) são preservados.
- Funções puras em src/domain/catalog-url.ts: filtersFromSearchParams (ignora formatos desconhecidos e repetidos, aceita minúsculas, trim no termo) e catalogSearchParams.
- Estado inicial do reducer lido da URL. A URL segue a combinação exibida (filters), não a otimista: cada mudança é um history.pushState; na abertura, a correção de um link inválido usa replaceState, sem nova entrada.
- popstate → ação restore no reducer, dentro da mesma transição dos filtros (a lista anterior continua na tela até a nova carregar). restore com os mesmos filtros devolve o mesmo estado.
- SearchBar: sem debounce e sem onChange; a busca só dispara no submit. O campo segue não controlado; a prop term reescreve o valor só quando o termo muda por fora (o mesmo termo só normalizado não apaga o que foi digitado).
- prefetch.ts: o script inline não antecipa a lista sem filtros quando q ou format estão na URL (a resposta seria descartada).
- Anti-objetivos: sem react-router, sem página nem modal de detalhe na URL, sem sincronizar a cada tecla.
</restricoes>

<criterios_bdd>
Dado que o visitante buscou um texto e selecionou formatos
Quando a listagem for atualizada
Então a URL deve conter o texto e os formatos como query params

Dado um link com texto e formatos nos query params
Quando o visitante abrir o link
Então os filtros devem vir preenchidos e a listagem já filtrada
E valores desconhecidos devem ser ignorados

Dado que o visitante mudou os filtros
Quando usar o voltar ou o avançar do navegador
Então os filtros, o campo de busca e a listagem daquela entrada devem voltar

Dado que o visitante digitou um texto no campo de busca
Quando não acionar "Buscar" nem pressionar Enter
Então nenhuma busca deve ser feita
</criterios_bdd>

<plano_tdd>
1. catalog-url.test.ts: leitura, normalização, formatos inválidos, escrita preservando outros parâmetros, ida e volta.
2. catalog-filters-reducer.test.ts: restore troca formatos e termo e mantém perPage; mesmos filtros devolvem o mesmo estado.
3. SearchBar.test.tsx: digitar não chama onSearch; submit e Enter chamam uma vez; term trocado por fora reescreve o campo; o mesmo termo normalizado não.
4. App.url.test.tsx (msw + renderWithCatalog): URL após busca e formatos (pushState); link abre filtrado com uma requisição; link inválido corrigido por replaceState; voltar duas vezes restaura filtros e campo sem nova requisição.
5. App.search.test.tsx: o cenário de debounce vira "digitar sem Buscar não faz requisição".
6. prefetch.test.ts: com q ou format na URL o script não chama fetch; com só utm, chama.
7. e2e/url.spec.ts e e2e/search.spec.ts: query params, link com uma requisição só (sem prefetch), voltar/avançar; digitar não busca.
</plano_tdd>

<design>
Sem mudança visual: campo e botão seguem specs/busca.md.
</design>

<arquivos>
src/domain/catalog-url.ts (+ teste), src/features/catalog/{use-catalog-url.ts, CatalogProvider.tsx, catalog-filters-reducer.ts} (+ teste),
src/components/filters/SearchBar.tsx (+ teste), src/App.tsx, src/App.url.test.tsx, src/App.search.test.tsx, src/test/setup.ts,
src/services/anilist/prefetch.ts (+ teste), e2e/{url,search}.spec.ts, docs (USE_CASES, REQUISITOS, specs/busca.md, PLANO, CHANGELOG, AI_LOG).
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e.
</verificacao>

<saida>
(1) Resumo; (2) divergências do UC05; (3) resultados; (4) commit convencional (ex.: "feat: sync filters with url query params (uc09)"); (5) entrada para docs/AI_LOG.md.
</saida>
```
