// Sem conhecer o AniList nem o Apollo: os mappers convertem as respostas para estes tipos.

export const ANIME_FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"] as const;

export type AnimeFormat = (typeof ANIME_FORMATS)[number];

export const ANIME_STATUSES = [
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
] as const;

export type AnimeStatus = (typeof ANIME_STATUSES)[number];

export interface Anime {
  id: number;
  title: string;
  /** Só quando difere do título principal. */
  englishTitle: string | null;
  coverUrl: string | null;
  coverColor: string | null;
  genres: string[];
  averageScore: number | null;
  format: AnimeFormat | null;
  /** Texto puro, sem tags HTML; parágrafos separados por linha em branco. */
  description: string | null;
  episodes: number | null;
  seasonYear: number | null;
  status: AnimeStatus | null;
  siteUrl: string | null;
}

export interface AnimePage {
  animes: Anime[];
  currentPage: number;
  hasNextPage: boolean;
}

export interface CatalogFilters {
  formats: AnimeFormat[];
  search?: string;
  perPage: number;
}

export function isAnimeFormat(value: string): value is AnimeFormat {
  return (ANIME_FORMATS as readonly string[]).includes(value);
}

export function isAnimeStatus(value: string): value is AnimeStatus {
  return (ANIME_STATUSES as readonly string[]).includes(value);
}
