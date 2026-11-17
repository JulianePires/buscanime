import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { ANILIST_URL } from "../../services/anilist/apollo-client";
import { buildDetailData, buildPageData } from "../fixtures/anime-page";

export const anilist = graphql.link(ANILIST_URL);

/**
 * Padrão: uma única página com três animes, e o detalhe de qualquer id (UC08). Cada teste
 * sobrescreve com server.use().
 */
export const handlers = [
  anilist.query("AnimePage", () => HttpResponse.json({ data: buildPageData({ ids: [1, 2, 3] }) })),
  anilist.query("AnimeDetail", ({ variables }) =>
    HttpResponse.json({ data: buildDetailData(Number(variables.id)) }),
  ),
];
