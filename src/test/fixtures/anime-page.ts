import type { AnimePageQuery } from "../../services/anilist/queries/page.graphql.generated";

type PageData = NonNullable<AnimePageQuery["Page"]>;
export type MediaData = NonNullable<NonNullable<PageData["media"]>[number]>;

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
    format: "TV",
    ...overrides,
  };
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
