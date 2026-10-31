import { useSuspenseQuery } from "@apollo/client/react";
import { useTransition } from "react";
import type { AnimeFormat } from "../../domain/anime";
import { toAnimePage, toAnimePageVariables } from "../../services/anilist/mappers";
import { ANIME_PAGE } from "../../services/anilist/queries/page.graphql";
import { useCatalogContext } from "./catalog-context";

/**
 * Facade do catálogo: os componentes recebem só tipos do domínio e ações. useSuspenseQuery,
 * fetchMore e o cache ficam escondidos aqui (ADR-003). Suspende na primeira carga de cada
 * combinação de filtros; erros sobem para o Error Boundary.
 */
export function useCatalog() {
  const { filters, attempt } = useCatalogContext();
  const actions = useCatalogFilters();
  const [isLoadingMore, startLoadingMore] = useTransition();
  const { data, fetchMore } = useSuspenseQuery(ANIME_PAGE, {
    variables: toAnimePageVariables(filters),
    queryKey: ["catalog", attempt],
  });
  const { animes, currentPage, hasNextPage } = toAnimePage(data);

  function loadMore() {
    if (!hasNextPage || isLoadingMore) return;
    startLoadingMore(async () => {
      await fetchMore({ variables: { page: currentPage + 1 } });
    });
  }

  return {
    animes,
    hasNextPage,
    isLoadingMore,
    loadMore,
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
    setPerPage: (perPage: number) => changeFilters({ type: "setPerPage", perPage }),
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
