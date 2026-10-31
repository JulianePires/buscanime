import {
  type Anime,
  type AnimePage,
  type CatalogFilters,
  isAnimeFormat,
  isAnimeStatus,
} from "../../domain/anime";
import type { AnimePageQuery, AnimePageQueryVariables } from "./queries/page.graphql.generated";

// Só este arquivo conhece os tipos gerados pelo Codegen.

type Media = NonNullable<NonNullable<NonNullable<AnimePageQuery["Page"]>["media"]>[number]>;

const MAX_GENRES = 3;
const UNTITLED = "Sem título";

/** Entidades que o AniList deixa na sinopse mesmo com `asHtml: false`. */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

function toTitle(title: Media["title"]) {
  return title?.romaji ?? title?.english ?? UNTITLED;
}

function toEnglishTitle(title: Media["title"]) {
  const english = title?.english;
  return english && english !== toTitle(title) ? english : null;
}

/** Texto puro: a UI renderiza a sinopse sem dangerouslySetInnerHTML. */
function toDescription(description: Media["description"]) {
  let text = description ?? "";
  let previous: string;
  do {
    previous = text;
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      // Sem "<" na classe: cada tentativa para no próximo "<", então a varredura fica linear
      .replace(/<[^<>]*>/g, "");
  } while (text !== previous);
  text = text
    .replace(/&(?:amp|quot|#0?39|lt|gt|nbsp);/g, (entity) => HTML_ENTITIES[entity])
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

function toStatus(status: Media["status"]) {
  return status && isAnimeStatus(status) ? status : null;
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
    englishTitle: toEnglishTitle(media.title),
    coverUrl: media.coverImage?.extraLarge ?? null,
    coverColor: media.coverImage?.color ?? null,
    genres: toGenres(media.genres),
    averageScore: media.averageScore,
    format: toFormat(media.format),
    description: toDescription(media.description),
    episodes: media.episodes,
    seasonYear: media.seasonYear,
    status: toStatus(media.status),
    siteUrl: media.siteUrl,
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

/** Filtros vazios vão como `undefined`: o JSON os omite da requisição e da chave do cache. */
export function toAnimePageVariables(filters: CatalogFilters): AnimePageQueryVariables {
  return {
    page: 1,
    perPage: filters.perPage,
    search: filters.search,
    formats: filters.formats.length > 0 ? filters.formats : undefined,
    sort: [filters.search ? "SEARCH_MATCH" : "POPULARITY_DESC"],
  };
}
