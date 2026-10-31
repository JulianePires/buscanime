import { useSuspenseQuery } from "@apollo/client/react";
import { useState, useTransition } from "react";
import type { AnimeFormat, CatalogFilters } from "../../domain/anime";
import { toAnimePage, toAnimePageVariables } from "../../services/anilist/mappers";
import { ANIME_PAGE } from "../../services/anilist/queries/page.graphql";
import { useCatalogContext } from "./catalog-context";

/**
 * Facade do catálogo: os componentes recebem só tipos do domínio e ações. useSuspenseQuery,
 * a busca da próxima página e o cache ficam escondidos aqui (ADR-003). Suspende na primeira carga de cada
 * combinação de filtros; erros da primeira página sobem para o Error Boundary, os do "Ver mais"
 * viram `loadMoreError` (UC06).
 */
export function useCatalog() {
  const { filters, attempt } = useCatalogContext();
  const actions = useCatalogFilters();
  const [isLoadingMore, startLoadingMore] = useTransition();
  const variables = toAnimePageVariables(filters);
  const { data, client } = useSuspenseQuery(ANIME_PAGE, {
    variables,
    queryKey: ["catalog", attempt],
  });
  const { animes, currentPage, hasNextPage } = toAnimePage(data);
  // Guarda os filtros da falha: trocar de combinação descarta o erro sem efeito nem reset manual
  const [failure, setFailure] = useState<{ filters: CatalogFilters; error: Error } | null>(null);
  const loadMoreError = failure?.filters === filters ? failure.error : null;

  /**
   * Próxima página por `client.query`, não pelo `fetchMore` do useSuspenseQuery: o `fetchMore`
   * rejeita a promise que a lista lê com `use()` e a falha derrubaria a lista no Error Boundary,
   * qualquer que seja o errorPolicy. Como `page` fica fora da chave do `Page` (cache.ts), a
   * resposta grava na mesma entrada e o `merge` de `Page.media` acumula e deduplica, como faria
   * o `fetchMore`.
   */
  function loadMore() {
    if (!hasNextPage || isLoadingMore) return;
    setFailure(null);
    startLoadingMore(async () => {
      try {
        await client.query({
          query: ANIME_PAGE,
          variables: { ...variables, page: currentPage + 1 },
          fetchPolicy: "network-only",
        });
      } catch (error) {
        // As páginas já carregadas continuam no cache; o erro fica junto ao "Ver mais"
        setFailure({ filters, error: error instanceof Error ? error : new Error(String(error)) });
      }
    });
  }

  return {
    animes,
    hasNextPage,
    isLoadingMore,
    loadMore,
    loadMoreError,
    ...actions,
    filters,
  };
}

/**
 * Filtros sem a consulta: para os controles que ficam fora do Suspense da lista (UC04). Expõe a
 * seleção otimista, que já reflete o clique enquanto a nova combinação carrega.
 */
export function useCatalogFilters() {
  const { selectedFilters, changeFilters, isFiltering } = useCatalogContext();
  return {
    selectedFilters,
    isFiltering,
    toggleFormat: (format: AnimeFormat) => changeFilters({ type: "toggleFormat", format }),
    clearFormats: () => changeFilters({ type: "clearFormats" }),
    search: (term: string) => changeFilters({ type: "search", term }),
  };
}

/**
 * Nova tentativa para o Error Boundary. O componente que falhou não chega a montar, então não
 * há `refetch` para chamar: trocar o queryKey descarta a referência com erro do suspense cache
 * e refaz a requisição (o cache normalizado continua valendo para o que já deu certo).
 */
export function useCatalogRetry() {
  return useCatalogContext().retry;
}
