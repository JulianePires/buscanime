import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPageData } from "../../test/fixtures/anime-page";
import { createCache } from "./cache";
import { ANIME_PAGE } from "./queries/page.graphql";
import type { AnimePageQueryVariables } from "./queries/page.graphql.generated";

const firstPage: AnimePageQueryVariables = { page: 1, perPage: 12, sort: ["POPULARITY_DESC"] };

type Cache = ReturnType<typeof createCache>;

function write(
  cache: Cache,
  variables: AnimePageQueryVariables,
  page: { ids: number[]; hasNextPage?: boolean },
) {
  const { ids, hasNextPage = false } = page;
  cache.writeQuery({
    query: ANIME_PAGE,
    variables,
    data: buildPageData({ ids, currentPage: variables.page, hasNextPage }),
  });
}

function read(cache: Cache, variables: AnimePageQueryVariables) {
  const data = cache.readQuery({ query: ANIME_PAGE, variables });
  return {
    ids: data?.Page?.media?.map((media) => media?.id),
    pageInfo: data?.Page?.pageInfo,
  };
}

describe("createCache — paginação do 'Ver mais'", () => {
  afterEach(() => vi.restoreAllMocks());

  describe("Dado que a primeira página de uma combinação de filtros já foi carregada", () => {
    describe("Quando a página seguinte é pedida", () => {
      it("Então o cache deve guardar as duas páginas no mesmo resultado, sem animes repetidos", () => {
        const cache = createCache();
        write(cache, firstPage, { ids: [1, 2, 3], hasNextPage: true });
        write(cache, { ...firstPage, page: 2 }, { ids: [3, 4, 5] });

        expect(read(cache, firstPage).ids).toEqual([1, 2, 3, 4, 5]);
      });

      it("E o pageInfo deve refletir a última página", () => {
        const cache = createCache();
        write(cache, firstPage, { ids: [1, 2], hasNextPage: true });
        write(cache, { ...firstPage, page: 2 }, { ids: [3, 4] });

        expect(read(cache, firstPage).pageInfo).toMatchObject({
          currentPage: 2,
          hasNextPage: false,
        });
      });

      it("não avisa perda de dados ao substituir o pageInfo", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const cache = createCache();
        write(cache, firstPage, { ids: [1], hasNextPage: true });
        write(cache, { ...firstPage, page: 2 }, { ids: [2] });

        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
      });
    });
  });

  it("normaliza Media pelo id, para o detalhe (UC03) ler sem nova requisição", () => {
    const cache = createCache();
    write(cache, firstPage, { ids: [42] });

    expect(cache.identify({ __typename: "Media", id: 42 })).toBe("Media:42");
    expect(cache.extract()).toHaveProperty("Media:42.title.romaji", "Anime 42");
  });

  it("separa combinações de format_in e search", () => {
    const cache = createCache();
    const movies = { ...firstPage, formats: ["MOVIE" as const] };
    const naruto = { ...firstPage, search: "naruto", sort: ["SEARCH_MATCH" as const] };
    write(cache, firstPage, { ids: [1, 2] });
    write(cache, movies, { ids: [10] });
    write(cache, naruto, { ids: [20] });

    expect(read(cache, firstPage).ids).toEqual([1, 2]);
    expect(read(cache, movies).ids).toEqual([10]);
    expect(read(cache, naruto).ids).toEqual([20]);
  });

  it("separa tamanhos de página diferentes", () => {
    const cache = createCache();
    write(cache, firstPage, { ids: [1, 2] });
    write(cache, { ...firstPage, perPage: 24 }, { ids: [1, 2, 3, 4] });

    expect(read(cache, firstPage).ids).toEqual([1, 2]);
    expect(read(cache, { ...firstPage, perPage: 24 }).ids).toEqual([1, 2, 3, 4]);
  });

  it("mantém o pageInfo de cada combinação ao alternar filtros", () => {
    const cache = createCache();
    const movies = { ...firstPage, formats: ["MOVIE" as const] };
    write(cache, firstPage, { ids: [1, 2], hasNextPage: true });
    write(cache, movies, { ids: [10] });

    expect(read(cache, firstPage).pageInfo).toMatchObject({ currentPage: 1, hasNextPage: true });
    expect(read(cache, movies).pageInfo).toMatchObject({ currentPage: 1, hasNextPage: false });
  });
});
