import { describe, expect, it } from "vitest";
import { buildMedia, buildPageData } from "../../test/fixtures/anime-page";
import { toAnime, toAnimePage, toAnimePageVariables } from "./mappers";

describe("toAnime (tipo gerado → domínio)", () => {
  it("converte o Media completo", () => {
    expect(toAnime(buildMedia(1))).toEqual({
      id: 1,
      title: "Anime 1",
      coverUrl: "https://img.anili.st/media/1.jpg",
      coverColor: "#6324c6",
      genres: ["Action", "Adventure"],
      averageScore: 80,
      format: "TV",
    });
  });

  it("usa o título em inglês quando não há romaji", () => {
    const media = buildMedia(1, {
      title: { __typename: "MediaTitle", romaji: null, english: "Attack on Titan" },
    });

    expect(toAnime(media).title).toBe("Attack on Titan");
  });

  it("usa um título padrão quando o AniList não envia nenhum", () => {
    expect(toAnime(buildMedia(1, { title: null })).title).toBe("Sem título");
  });

  it("limita os gêneros a 3 e descarta nulos", () => {
    const media = buildMedia(1, { genres: ["Action", null, "Drama", "Fantasy", "Mystery"] });

    expect(toAnime(media).genres).toEqual(["Action", "Drama", "Fantasy"]);
  });

  it("mantém averageScore nulo e trata capa, gêneros e formato ausentes", () => {
    const anime = toAnime(
      buildMedia(1, { averageScore: null, coverImage: null, genres: null, format: null }),
    );

    expect(anime).toMatchObject({
      averageScore: null,
      coverUrl: null,
      coverColor: null,
      genres: [],
      format: null,
    });
  });

  it("descarta formatos que não são de anime", () => {
    expect(toAnime(buildMedia(1, { format: "MANGA" })).format).toBeNull();
  });
});

describe("toAnimePage", () => {
  it("achata a resposta, ignora itens nulos e lê o pageInfo", () => {
    const data = buildPageData({ ids: [1, 2], currentPage: 3, hasNextPage: true });
    data.Page?.media?.push(null);

    expect(toAnimePage(data)).toMatchObject({
      animes: [{ id: 1 }, { id: 2 }],
      currentPage: 3,
      hasNextPage: true,
    });
  });

  it("trata Page e pageInfo ausentes como página vazia e final", () => {
    expect(toAnimePage({ Page: null })).toEqual({ animes: [], currentPage: 1, hasNextPage: false });
  });
});

describe("toAnimePageVariables (filtros → variáveis da query)", () => {
  it("sem filtros: página 1, popularidade e sem search/formats", () => {
    expect(toAnimePageVariables({ formats: [], perPage: 12 })).toStrictEqual({
      page: 1,
      perPage: 12,
      search: undefined,
      formats: undefined,
      sort: ["POPULARITY_DESC"],
    });
  });

  it("com termo: ordena por relevância", () => {
    expect(toAnimePageVariables({ formats: ["OVA"], search: "one piece", perPage: 48 })).toEqual({
      page: 1,
      perPage: 48,
      search: "one piece",
      formats: ["OVA"],
      sort: ["SEARCH_MATCH"],
    });
  });
});
