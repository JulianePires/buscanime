import { ApolloProvider } from "@apollo/client/react";
import { type ReactNode, useOptimistic, useReducer, useState, useTransition } from "react";
import type { CatalogClient } from "../../services/anilist/apollo-client";
import { CatalogContext } from "./catalog-context";
import { catalogFiltersReducer, initialCatalogFilters } from "./catalog-filters-reducer";
import { currentPageSize, useViewportPageSize } from "./use-viewport-page-size";

interface CatalogProviderProps {
  /** Injetado pela composição (main.tsx) ou pelos testes (createTestApolloClient). */
  client: CatalogClient;
  children: ReactNode;
}

/** Único ponto com ApolloProvider; guarda os filtros e o contador de novas tentativas. */
export function CatalogProvider({ client, children }: CatalogProviderProps) {
  // O tamanho da página começa pela largura atual e acompanha as faixas (domain/page-size.ts)
  const [filters, dispatch] = useReducer(catalogFiltersReducer, initialCatalogFilters, (state) => ({
    ...state,
    perPage: currentPageSize(),
  }));
  // Os controles mostram a escolha na hora; a lista só troca quando a nova combinação carrega
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
