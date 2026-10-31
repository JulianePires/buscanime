import { InMemoryCache, type Reference } from "@apollo/client";

/**
 * Cache normalizado do catálogo (ADR-003).
 *
 * O `Page` do AniList não tem id, então fica embutido no ROOT_QUERY. O argumento `page` fica
 * fora da chave para que o "Ver mais" grave todas as páginas de uma combinação no mesmo objeto.
 * Os filtros entram na chave do `Page` pelas variáveis da operação: sem isso, o `pageInfo` de
 * uma combinação sobrescreveria o de outra (ele é irmão de `media`, não filho).
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
            // Vale o pageInfo da última página carregada
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  });
}
