import { gql, type TypedDocumentNode } from "@apollo/client";
import type { AnimePageQuery, AnimePageQueryVariables } from "./page.graphql.generated";

// Só o que o card mostra: o modal tem consulta própria (detail.graphql.ts, ADR-004).
// O title.english fica porque é o título de reserva do card.
export const ANIME_PAGE: TypedDocumentNode<AnimePageQuery, AnimePageQueryVariables> = gql`
  query AnimePage(
    $page: Int!
    $perPage: Int!
    $search: String
    $formats: [MediaFormat]
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
      }
      media(type: ANIME, search: $search, format_in: $formats, sort: $sort) {
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
      }
    }
  }
`;
