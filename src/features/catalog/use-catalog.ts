import { useSuspenseQuery } from "@apollo/client/react";
import { useState, useTransition } from "react";
import type { AnimeFormat, CatalogFilters } from "../../domain/anime";
import { toAnimePage, toAnimePageVariables } from "../../services/anilist/mappers";
import { ANIME_PAGE } from "../../services/anilist/queries/page.graphql";
import { useCatalogContext } from "./catalog-context";

/** Facade do catálogo: os componentes recebem só tipos do domínio e ações (ADR-003). */
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
  // Preso aos filtros: ao trocá-los, o erro some sem efeito nem reset manual
  const [failure, setFailure] = useState<{ filters: CatalogFilters; error: Error } | null>(null);
  const loadMoreError = failure?.filters === filters ? failure.error : null;

  /**
   * Sem `fetchMore`: a falha dele rejeita a promise que a lista lê e a derruba no Error Boundary.
   * O `merge` de `Page.media` (cache.ts) acumula a resposta do `client.query` do mesmo jeito.
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

/** Sem a consulta: para os controles que ficam fora do Suspense da lista. */
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

/** O componente que falhou não montou, então não há `refetch`: trocar o queryKey refaz a consulta. */
export function useCatalogRetry() {
  return useCatalogContext().retry;
}
