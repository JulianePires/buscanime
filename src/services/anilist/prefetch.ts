import { print } from "graphql";
import type { CatalogFilters } from "../../domain/anime";
import { PAGE_SIZE_BANDS } from "../../domain/page-size";
import { createCache } from "./cache";
import { toAnimePageVariables } from "./mappers";
import { ANIME_PAGE } from "./queries/page.graphql";

// Um script inline no index.html pede a primeira página antes do bundle (LCP); o Apollo
// reaproveita a resposta. Medições no AI_LOG.md (Decisões).

const ANILIST_ACCEPT = "application/graphql-response+json,application/json;q=0.9";

declare global {
  interface Window {
    __ANIME_PAGE_PREFETCH__?: { variables: string; response: Promise<Response> };
  }
}

export interface PrefetchConfig {
  url: string;
  accept: string;
  query: string;
  /** `perPage` é trocado pelo da faixa de largura. */
  variables: Record<string, unknown>;
  bands: readonly { minWidth: number; perPage: number }[];
}

export function animePagePrefetchConfig(filters: CatalogFilters, url: string) {
  return {
    url,
    accept: ANILIST_ACCEPT,
    // Com o __typename que o cache acrescenta e a normalização exige
    query: print(createCache().transformDocument(ANIME_PAGE)),
    // Sem os filtros vazios (undefined), como no corpo que o Apollo envia
    variables: JSON.parse(JSON.stringify(toAnimePageVariables(filters))),
    bands: PAGE_SIZE_BANDS,
  } satisfies PrefetchConfig;
}

/** Serializada pelo `toString()`: precisa ser autocontida, sem imports nem constantes do módulo. */
function startAnimePagePrefetch(config: PrefetchConfig) {
  const band = config.bands.find((item) => window.innerWidth >= item.minWidth);
  const variables = JSON.stringify({ ...config.variables, perPage: band?.perPage });
  const body = new URLSearchParams({ operationName: "AnimePage", query: config.query, variables });
  const response = fetch(config.url, {
    method: "POST",
    body,
    headers: { accept: config.accept },
  });
  window.__ANIME_PAGE_PREFETCH__ = { variables, response };
  response
    .then((result) => result.clone().json())
    .then((json) => {
      const href = json?.data?.Page?.media?.[0]?.coverImage?.extraLarge;
      if (!href) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute("fetchpriority", "high");
      document.head.append(link);
    })
    // Sem capa antecipada; o Apollo refaz a requisição
    .catch(() => undefined);
}

export function animePagePrefetchScript(config: PrefetchConfig) {
  // Nenhum texto da configuração pode fechar o <script>
  const data = JSON.stringify(config).replaceAll("<", "\\u003c");
  return `(${startAnimePagePrefetch.toString()})(${data});`;
}

/** Vale uma vez, e só com as mesmas variáveis: a largura pode ter mudado de faixa. */
export function takePrefetchedResponse(operationName: string, variables: unknown) {
  const prefetch = typeof window === "undefined" ? undefined : window.__ANIME_PAGE_PREFETCH__;
  if (!prefetch || operationName !== "AnimePage") return undefined;
  delete window.__ANIME_PAGE_PREFETCH__;
  if (prefetch.variables !== JSON.stringify(variables)) return undefined;
  // O script inline também lê o corpo
  return prefetch.response.then((response) => response.clone());
}
