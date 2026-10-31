import { ApolloProvider } from "@apollo/client/react";
import { type ReactNode, useReducer, useState, useTransition } from "react";
import type { CatalogClient } from "../../services/anilist/apollo-client";
import { CatalogContext } from "./catalog-context";
import { catalogFiltersReducer, initialCatalogFilters } from "./catalog-filters-reducer";

interface CatalogProviderProps {
  /** Injetado pela composição (main.tsx) ou pelos testes (createTestApolloClient). */
  client: CatalogClient;
  children: ReactNode;
}

/** Único ponto com ApolloProvider; guarda os filtros e o contador de novas tentativas. */
export function CatalogProvider({ client, children }: CatalogProviderProps) {
  const [filters, dispatch] = useReducer(catalogFiltersReducer, initialCatalogFilters);
  const [isFiltering, startFiltering] = useTransition();
  const [attempt, setAttempt] = useState(0);

  const value = {
    filters,
    changeFilters: (action: Parameters<typeof dispatch>[0]) =>
      startFiltering(() => dispatch(action)),
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
