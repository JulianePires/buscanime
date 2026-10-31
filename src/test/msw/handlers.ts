import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { ANILIST_URL } from "../../services/anilist/apollo-client";
import { buildPageData } from "../fixtures/anime-page";

export const anilist = graphql.link(ANILIST_URL);

/** Padrão: uma única página com três animes. Cada teste sobrescreve com server.use(). */
export const handlers = [
  anilist.query("AnimePage", () => HttpResponse.json({ data: buildPageData({ ids: [1, 2, 3] }) })),
];
