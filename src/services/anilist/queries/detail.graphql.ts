import { gql, type TypedDocumentNode } from "@apollo/client";
import type { AnimeDetailQuery, AnimeDetailQueryVariables } from "./detail.graphql.generated";

// Pedida quando o modal abre (UC08, ADR-004). Traz também os campos do card para não depender
// do que a listagem deixou no cache; o Media:<id> normalizado recebe os campos que faltam.
export const ANIME_DETAIL: TypedDocumentNode<AnimeDetailQuery, AnimeDetailQueryVariables> = gql`
  query AnimeDetail($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
      }
      coverImage {
        extraLarge
        color
      }
      genres
      averageScore
      format
      description(asHtml: false)
      episodes
      seasonYear
      status
      siteUrl
    }
  }
`;
