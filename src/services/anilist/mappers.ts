import { type Anime, type AnimePage, type CatalogFilters, isAnimeFormat } from "../../domain/anime";
import type { AnimePageQuery, AnimePageQueryVariables } from "./queries/page.graphql.generated";

// Anti-Corruption Layer: só este arquivo conhece os tipos gerados pelo Codegen.

type Media = NonNullable<NonNullable<NonNullable<AnimePageQuery["Page"]>["media"]>[number]>;

const MAX_GENRES = 3;
const UNTITLED = "Sem título";

function toTitle(title: Media["title"]) {
  return title?.romaji ?? title?.english ?? UNTITLED;
}

function toGenres(genres: Media["genres"]) {
  return (genres ?? []).filter((genre): genre is string => genre !== null).slice(0, MAX_GENRES);
}

function toFormat(format: Media["format"]) {
  return format && isAnimeFormat(format) ? format : null;
}

export function toAnime(media: Media): Anime {
  return {
    id: media.id,
    title: toTitle(media.title),
    coverUrl: media.coverImage?.extraLarge ?? null,
    coverColor: media.coverImage?.color ?? null,
    genres: toGenres(media.genres),
    averageScore: media.averageScore,
    format: toFormat(media.format),
  };
}

export function toAnimePage(data: AnimePageQuery): AnimePage {
  const media = data.Page?.media ?? [];
  return {
    animes: media.filter((item): item is Media => item !== null).map(toAnime),
    currentPage: data.Page?.pageInfo?.currentPage ?? 1,
    hasNextPage: data.Page?.pageInfo?.hasNextPage ?? false,
  };
}

/**
 * Filtros → variáveis da primeira página. Filtros vazios vão como `undefined` (o JSON os omite),
 * o que mantém a requisição e as chaves do cache sem variáveis inúteis.
 */
export function toAnimePageVariables(filters: CatalogFilters): AnimePageQueryVariables {
  return {
    page: 1,
    perPage: filters.perPage,
    search: filters.search,
    formats: filters.formats.length > 0 ? filters.formats : undefined,
    sort: [filters.search ? "SEARCH_MATCH" : "POPULARITY_DESC"],
  };
}
