import { type CatalogFilters, isAnimeFormat } from "./anime";

// UC09: a combinação exibida fica na URL, para compartilhar o link e usar voltar/avançar.
// O tamanho da página não entra: depende da largura de quem abre o link.

export const SEARCH_PARAM = "q";
export const FORMAT_PARAM = "format";

export type UrlFilters = Pick<CatalogFilters, "formats" | "search">;

/** Valores desconhecidos ou repetidos são ignorados; o termo é normalizado como na busca. */
export function filtersFromSearchParams(search: string): UrlFilters {
  const params = new URLSearchParams(search);
  const formats = params
    .getAll(FORMAT_PARAM)
    .map((value) => value.toUpperCase())
    .filter(isAnimeFormat);
  return {
    formats: [...new Set(formats)],
    search: params.get(SEARCH_PARAM)?.trim() || undefined,
  };
}

/** Troca só `q` e `format` na query string atual e mantém os outros parâmetros. */
export function catalogSearchParams(current: string, { formats, search }: UrlFilters) {
  const params = new URLSearchParams(current);
  params.delete(SEARCH_PARAM);
  params.delete(FORMAT_PARAM);
  if (search) params.set(SEARCH_PARAM, search);
  for (const format of formats) params.append(FORMAT_PARAM, format);
  const query = params.toString();
  return query ? `?${query}` : "";
}
