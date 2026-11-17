import type { AnimeDetailQuery } from "../../services/anilist/queries/detail.graphql.generated";
import type { AnimePageQuery } from "../../services/anilist/queries/page.graphql.generated";

type PageData = NonNullable<AnimePageQuery["Page"]>;
/** Media da listagem: só os campos do card (ADR-004). */
export type MediaData = NonNullable<NonNullable<PageData["media"]>[number]>;
/** Media do detalhe: os campos do card e os que só o modal mostra. */
export type DetailMediaData = NonNullable<AnimeDetailQuery["Media"]>;

/** Media no formato da resposta do AniList (com __typename, como o Apollo grava no cache). */
export function buildMedia(id: number, overrides: Partial<MediaData> = {}): MediaData {
  return {
    __typename: "Media",
    id,
    title: { __typename: "MediaTitle", romaji: `Anime ${id}`, english: `Anime ${id} (EN)` },
    coverImage: {
      __typename: "MediaCoverImage",
      extraLarge: `https://img.anili.st/media/${id}.jpg`,
      color: "#6324c6",
    },
    genres: ["Action", "Adventure"],
    averageScore: 80,
    ...overrides,
  };
}

export function buildDetailMedia(
  id: number,
  overrides: Partial<DetailMediaData> = {},
): DetailMediaData {
  return {
    ...buildMedia(id),
    format: "TV",
    description: `Sinopse do anime ${id}.`,
    episodes: 12,
    seasonYear: 2023,
    status: "FINISHED",
    siteUrl: `https://anilist.co/anime/${id}`,
    ...overrides,
  };
}

/** Resposta `data` da operação AnimeDetail. */
export function buildDetailData(
  id: number,
  overrides: Partial<DetailMediaData> = {},
): AnimeDetailQuery {
  return { Media: buildDetailMedia(id, overrides) };
}

interface PageOptions {
  ids: number[];
  currentPage?: number;
  hasNextPage?: boolean;
  overrides?: Partial<MediaData>;
}

/** Resposta `data` da operação AnimePage. */
export function buildPageData({
  ids,
  currentPage = 1,
  hasNextPage = false,
  overrides,
}: PageOptions): AnimePageQuery {
  return {
    Page: {
      __typename: "Page",
      pageInfo: { __typename: "PageInfo", currentPage, hasNextPage },
      media: ids.map((id) => buildMedia(id, overrides)),
    },
  };
}
