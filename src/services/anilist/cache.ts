import { InMemoryCache, type Reference } from "@apollo/client";

/**
 * `page` fica fora da chave: o "Ver mais" grava todas as páginas de uma combinação no mesmo
 * objeto. Os filtros entram nela, senão o `pageInfo` de uma combinação sobrescreveria o de outra.
 */
export function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          Page: {
            keyArgs: ["perPage", "$search", "$formats", "$sort"],
            merge: true,
          },
        },
      },
      Page: {
        fields: {
          media: {
            keyArgs: ["type", "search", "format_in", "sort"],
            merge(
              existing: readonly Reference[] = [],
              incoming: readonly Reference[],
              { readField },
            ) {
              const seen = new Set(existing.map((media) => readField<number>("id", media)));
              const fresh = incoming.filter((media) => !seen.has(readField<number>("id", media)));
              return [...existing, ...fresh];
            },
          },
          pageInfo: {
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  });
}
