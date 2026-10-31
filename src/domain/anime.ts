// Tipos do domínio: estáveis, sem nulos aninhados e sem conhecer o AniList nem o Apollo.

export const ANIME_FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"] as const;

export type AnimeFormat = (typeof ANIME_FORMATS)[number];

export interface Anime {
  id: number;
  title: string;
  coverUrl: string | null;
  coverColor: string | null;
  genres: string[];
  averageScore: number | null;
  format: AnimeFormat | null;
}

export interface AnimePage {
  animes: Anime[];
  currentPage: number;
  hasNextPage: boolean;
}

/** Filtros escolhidos pelo visitante; definem qual combinação de páginas é carregada. */
export interface CatalogFilters {
  formats: AnimeFormat[];
  search?: string;
  perPage: number;
}

export function isAnimeFormat(value: string): value is AnimeFormat {
  return (ANIME_FORMATS as readonly string[]).includes(value);
}
