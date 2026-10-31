import { createContext, use } from "react";
import type { CatalogFilters } from "../../domain/anime";
import type { CatalogFiltersAction } from "./catalog-filters-reducer";

export interface CatalogContextValue {
  /** Filtros da consulta exibida. */
  filters: CatalogFilters;
  /** Já inclui a mudança ainda em transição (useOptimistic). */
  selectedFilters: CatalogFilters;
  changeFilters: (action: CatalogFiltersAction) => void;
  isFiltering: boolean;
  /** Entra no queryKey: mudar refaz a consulta que falhou. */
  attempt: number;
  retry: () => void;
}

export const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalogContext() {
  const context = use(CatalogContext);
  if (!context) throw new Error("useCatalog precisa estar dentro de <CatalogProvider>.");
  return context;
}
