import { useSuspenseQuery } from "@apollo/client/react";
import type { AnimeDetail } from "../../domain/anime";
import { toAnimeDetail } from "../../services/anilist/mappers";
import { ANIME_DETAIL } from "../../services/anilist/queries/detail.graphql";

export class AnimeNotFoundError extends Error {
  constructor(id: number) {
    super(`Anime ${id} não encontrado no AniList.`);
    this.name = "AnimeNotFoundError";
  }
}

/**
 * Facade do detalhe (UC08, ADR-004): consulta própria, separada da listagem. `cache-first`:
 * reabrir o mesmo anime lê o Media:<id> já completo, sem rede. Como no catálogo, uma nova
 * tentativa troca o `queryKey`, porque o componente que falhou não montou e não tem `refetch`.
 */
export function useAnimeDetail(id: number, attempt = 0): AnimeDetail {
  const { data } = useSuspenseQuery(ANIME_DETAIL, {
    variables: { id },
    queryKey: ["anime-detail", attempt],
  });
  const detail = toAnimeDetail(data);
  if (!detail) throw new AnimeNotFoundError(id);
  return detail;
}
