import type { AnimeFormat, CatalogFilters } from "../../domain/anime";
import type { UrlFilters } from "../../domain/catalog-url";

// Só o estado do cliente: páginas e erros ficam no cache do Apollo.

export type CatalogFiltersAction =
  | { type: "toggleFormat"; format: AnimeFormat }
  | { type: "clearFormats" }
  | { type: "search"; term: string }
  | { type: "setPerPage"; perPage: number }
  /** Voltar/avançar do navegador (UC09): os filtros vêm da URL. */
  | { type: "restore"; filters: UrlFilters };

export const initialCatalogFilters: CatalogFilters = {
  formats: [],
  search: undefined,
  perPage: 12,
};

function sameUrlFilters(state: CatalogFilters, filters: UrlFilters) {
  return (
    state.search === filters.search &&
    state.formats.length === filters.formats.length &&
    state.formats.every((format, index) => format === filters.formats[index])
  );
}

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
      // Mesmo objeto: não recarrega a lista nem invalida o erro e o foco do "Ver mais"
      return state.perPage === action.perPage ? state : { ...state, perPage: action.perPage };
    case "restore":
      return sameUrlFilters(state, action.filters) ? state : { ...state, ...action.filters };
  }
}
