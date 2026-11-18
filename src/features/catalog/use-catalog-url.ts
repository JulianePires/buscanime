import { useEffect, useEffectEvent, useRef } from "react";
import type { CatalogFilters } from "../../domain/anime";
import {
  catalogSearchParams,
  filtersFromSearchParams,
  type UrlFilters,
} from "../../domain/catalog-url";

/** Filtros do link aberto, para o estado inicial do catálogo. */
export function currentUrlFilters() {
  return filtersFromSearchParams(window.location.search);
}

/**
 * Mantém a URL igual à combinação exibida (UC09): cada mudança dos filtros é uma entrada no
 * histórico, e voltar/avançar devolve os filtros daquela entrada por `onNavigate`.
 */
export function useCatalogUrl(
  { formats, search }: CatalogFilters,
  onNavigate: (filters: UrlFilters) => void,
) {
  const synced = useRef(false);

  // `formats` mantém a identidade quando só o tamanho da página muda: a URL não é tocada
  useEffect(() => {
    const { pathname, search: current, hash } = window.location;
    const next = catalogSearchParams(current, { formats, search });
    const first = !synced.current;
    synced.current = true;
    if (next === current) return;
    const url = `${pathname}${next}${hash}`;
    // Na abertura, só corrige o link (valor inválido, termo com espaços) sem criar entrada
    if (first) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }, [formats, search]);

  const restore = useEffectEvent(() => onNavigate(currentUrlFilters()));
  useEffect(() => {
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
}
