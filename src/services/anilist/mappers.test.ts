import { describe, expect, it } from "vitest";
import { buildMedia, buildPageData } from "../../test/fixtures/anime-page";
import { toAnime, toAnimePage, toAnimePageVariables } from "./mappers";

describe("toAnime (tipo gerado → domínio)", () => {
  it("converte o Media completo", () => {
    expect(toAnime(buildMedia(1))).toEqual({
      id: 1,
      title: "Anime 1",
      englishTitle: "Anime 1 (EN)",
      coverUrl: "https://img.anili.st/media/1.jpg",
      coverColor: "#6324c6",
      genres: ["Action", "Adventure"],
      averageScore: 80,
      format: "TV",
      description: "Sinopse do anime 1.",
      episodes: 12,
      seasonYear: 2023,
      status: "FINISHED",
      siteUrl: "https://anilist.co/anime/1",
    });
  });

  it("usa o título em inglês quando não há romaji, sem repeti-lo como título em inglês", () => {
    const media = buildMedia(1, {
      title: { __typename: "MediaTitle", romaji: null, english: "Attack on Titan" },
    });

    expect(toAnime(media)).toMatchObject({ title: "Attack on Titan", englishTitle: null });
  });

  it("não repete o título em inglês quando é igual ao romaji", () => {
    const media = buildMedia(1, {
      title: { __typename: "MediaTitle", romaji: "Naruto", english: "Naruto" },
    });

    expect(toAnime(media).englishTitle).toBeNull();
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

describe("toAnime - campos do detalhe (UC03)", () => {
  it("tira as tags HTML da sinopse e mantém as quebras de linha como texto", () => {
    const media = buildMedia(1, {
      description: "Akira <i>sobrevive</i> ao apocalipse.<br><br>\n(Fonte: <b>Crunchyroll</b>)",
    });

    expect(toAnime(media).description).toBe(
      "Akira sobrevive ao apocalipse.\n\n(Fonte: Crunchyroll)",
    );
  });

  it("decodifica as entidades HTML que o AniList envia na sinopse", () => {
    const media = buildMedia(1, {
      description: "Tom &amp; Jerry: &quot;caça&quot; &#039;eterna&#039;",
    });

    expect(toAnime(media).description).toBe(`Tom & Jerry: "caça" 'eterna'`);
  });

  it("sinopse só com tags ou espaços vira nula", () => {
    expect(toAnime(buildMedia(1, { description: " <br> " })).description).toBeNull();
  });

  it("trata sinopse, episódios, ano, situação e link ausentes como nulos", () => {
    const anime = toAnime(
      buildMedia(1, {
        description: null,
        episodes: null,
        seasonYear: null,
        status: null,
        siteUrl: null,
      }),
    );

    expect(anime).toMatchObject({
      description: null,
      episodes: null,
      seasonYear: null,
      status: null,
      siteUrl: null,
    });
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
