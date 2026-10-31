import { useState } from "react";
import { AnimeGrid } from "../../components/anime/AnimeGrid";
import { EmptyState } from "../../components/feedback/EmptyState";
import { LoadMoreButton } from "../../components/pagination/LoadMoreButton";
import type { CatalogFilters } from "../../domain/anime";
import { useCatalog } from "./use-catalog";

/**
 * Liga a facade à apresentação. Suspende na primeira carga; erros da primeira página sobem para
 * o Error Boundary.
 */
export function CatalogResults() {
  const { animes, isFiltering, filters, hasNextPage, isLoadingMore, loadMore, loadMoreError } =
    useCatalog();
  // Primeiro índice novo do último "Ver mais", preso aos filtros em que foi pedido: depois de
  // trocar os filtros o alvo some, e a lista nova não rouba o foco
  const [focusTarget, setFocusTarget] = useState<{ filters: CatalogFilters; index: number }>();
  const focusIndex = focusTarget?.filters === filters ? focusTarget.index : undefined;

  if (animes.length === 0) return <EmptyState term={filters.search} />;

  function handleLoadMore() {
    setFocusTarget({ filters, index: animes.length });
    loadMore();
  }

  return (
    <>
      <AnimeGrid animes={animes} busy={isFiltering} focusIndex={focusIndex} />
      <LoadMoreButton
        hasNextPage={hasNextPage}
        loading={isLoadingMore}
        error={loadMoreError !== null}
        onLoadMore={handleLoadMore}
      />
    </>
  );
}
