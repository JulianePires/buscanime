import { ApolloClient, CombinedGraphQLErrors, HttpLink } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { createCache } from "./cache";
import { takePrefetchedResponse } from "./prefetch";

export const ANILIST_URL = "https://graphql.anilist.co";

interface ApolloClientOptions {
  uri?: string;
  fetch?: typeof globalThis.fetch;
  logErrors?: boolean;
  /** `false` mantém o corpo em JSON, o único que o MSW dos testes lê. */
  formEncoded?: boolean;
}

/** Em campos de formulário, o POST é uma requisição simples de CORS: sem o OPTIONS antes. */
function formEncodedFetch(baseFetch?: typeof globalThis.fetch) {
  // Chamado solto (sem `this`), o fetch nativo dá "Illegal invocation"
  const send = baseFetch ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));
  return (input: RequestInfo | URL, init: RequestInit = {}) => {
    const { operationName, query, variables } = JSON.parse(String(init.body));
    const headers = new Headers(init.headers);
    // O URLSearchParams define o próprio content-type
    headers.delete("content-type");
    const body = new URLSearchParams({
      operationName,
      query,
      variables: JSON.stringify(variables ?? {}),
    });
    const request = () => send(input, { ...init, headers, body });
    return takePrefetchedResponse(operationName, variables)?.catch(request) ?? request();
  };
}

/** Sem RetryLink: um 429 do AniList não é reenviado; o visitante decide no Error Boundary. */
export function createApolloClient({
  uri = ANILIST_URL,
  fetch,
  logErrors = import.meta.env.DEV,
  formEncoded = true,
}: ApolloClientOptions = {}) {
  const errorLink = new ErrorLink(({ error, operation }) => {
    if (!logErrors) return;
    const kind = CombinedGraphQLErrors.is(error) ? "GraphQL" : "rede";
    // biome-ignore lint/suspicious/noConsole: só em desenvolvimento (logErrors)
    console.warn(`[AniList] erro de ${kind} em ${operation.operationName}:`, error); // eslint-disable-line no-console
  });

  return new ApolloClient({
    link: errorLink.concat(
      new HttpLink({ uri, fetch: formEncoded ? formEncodedFetch(fetch) : fetch }),
    ),
    cache: createCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-first", nextFetchPolicy: "cache-first" },
    },
  });
}

export type CatalogClient = ReturnType<typeof createApolloClient>;
