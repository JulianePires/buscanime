import { ApolloClient, CombinedGraphQLErrors, HttpLink } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { createCache } from "./cache";

export const ANILIST_URL = "https://graphql.anilist.co";

interface ApolloClientOptions {
  uri?: string;
  fetch?: typeof globalThis.fetch;
  /** Loga erros no console; padrão só em desenvolvimento. */
  logErrors?: boolean;
}

/**
 * Factory pura: cada chamada cria client, links e cache novos (os testes isolam o cache assim).
 * Não há RetryLink: um HTTP 429 (rate limit do AniList) não é reenviado e vai para o Error
 * Boundary, onde o visitante decide tentar novamente.
 */
export function createApolloClient({
  uri = ANILIST_URL,
  fetch,
  logErrors = import.meta.env.DEV,
}: ApolloClientOptions = {}) {
  const errorLink = new ErrorLink(({ error, operation }) => {
    if (!logErrors) return;
    const kind = CombinedGraphQLErrors.is(error) ? "GraphQL" : "rede";
    // biome-ignore lint/suspicious/noConsole: só em desenvolvimento (logErrors)
    console.warn(`[AniList] erro de ${kind} em ${operation.operationName}:`, error); // eslint-disable-line no-console
  });

  return new ApolloClient({
    link: errorLink.concat(new HttpLink({ uri, fetch })),
    cache: createCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-first", nextFetchPolicy: "cache-first" },
    },
  });
}

export type CatalogClient = ReturnType<typeof createApolloClient>;
