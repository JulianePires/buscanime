import type { AnimeFormat, CatalogFilters } from "../../domain/anime";

// Estado do cliente (filtros). O estado do servidor (páginas, erro) fica no cache do Apollo.

export type CatalogFiltersAction =
  | { type: "toggleFormat"; format: AnimeFormat }
  | { type: "clearFormats" }
  | { type: "search"; term: string }
  | { type: "setPerPage"; perPage: number };

export const initialCatalogFilters: CatalogFilters = {
  formats: [],
  search: undefined,
  perPage: 12,
};

export function catalogFiltersReducer(
  state: CatalogFilters,
  action: CatalogFiltersAction,
): CatalogFilters {
  switch (action.type) {
    case "toggleFormat":
      return {
        ...state,
        formats: state.formats.includes(action.format)
          ? state.formats.filter((format) => format !== action.format)
          : [...state.formats, action.format],
      };
    case "clearFormats":
      return { ...state, formats: [] };
    case "search":
      return { ...state, search: action.term.trim() || undefined };
    case "setPerPage":
      return { ...state, perPage: action.perPage };
  }
}
