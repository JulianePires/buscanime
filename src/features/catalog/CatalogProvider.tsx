import { ApolloProvider } from "@apollo/client/react";
import { type ReactNode, useOptimistic, useReducer, useState, useTransition } from "react";
import type { CatalogClient } from "../../services/anilist/apollo-client";
import { CatalogContext } from "./catalog-context";
import { catalogFiltersReducer, initialCatalogFilters } from "./catalog-filters-reducer";
import { currentPageSize, useViewportPageSize } from "./use-viewport-page-size";

interface CatalogProviderProps {
  client: CatalogClient;
  children: ReactNode;
}

export function CatalogProvider({ client, children }: CatalogProviderProps) {
  const [filters, dispatch] = useReducer(catalogFiltersReducer, initialCatalogFilters, (state) => ({
    ...state,
    perPage: currentPageSize(),
  }));
  // Os controles mostram a escolha na hora; a lista troca quando a nova combinação carrega
  const [selectedFilters, applyOptimistic] = useOptimistic(filters, catalogFiltersReducer);
  const [isFiltering, startFiltering] = useTransition();
  const [attempt, setAttempt] = useState(0);

  const changeFilters = (action: Parameters<typeof dispatch>[0]) =>
    startFiltering(() => {
      applyOptimistic(action);
      dispatch(action);
    });
  useViewportPageSize((perPage) => changeFilters({ type: "setPerPage", perPage }));

  const value = {
    filters,
    selectedFilters,
    changeFilters,
    isFiltering,
    attempt,
    retry: () => setAttempt((current) => current + 1),
  };

  return (
    <ApolloProvider client={client}>
      <CatalogContext value={value}>{children}</CatalogContext>
    </ApolloProvider>
  );
}
