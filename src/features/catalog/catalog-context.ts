import { createContext, use } from "react";
import type { CatalogFilters } from "../../domain/anime";
import type { CatalogFiltersAction } from "./catalog-filters-reducer";

export interface CatalogContextValue {
  filters: CatalogFilters;
  /** Aplica a ação dentro de uma transição: a lista anterior fica visível enquanto carrega. */
  changeFilters: (action: CatalogFiltersAction) => void;
  isFiltering: boolean;
  /** Muda a cada "Tentar novamente" e entra no queryKey do useSuspenseQuery. */
  attempt: number;
  retry: () => void;
}

export const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalogContext() {
  const context = use(CatalogContext);
  if (!context) throw new Error("useCatalog precisa estar dentro de <CatalogProvider>.");
  return context;
}
