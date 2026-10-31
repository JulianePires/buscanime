import { gql, type TypedDocumentNode } from "@apollo/client";
import type { AnimePageQuery, AnimePageQueryVariables } from "./page.graphql.generated";

// Já traz os campos do detalhe: abrir o modal lê o cache, sem rede.
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
        format
        description(asHtml: false)
        episodes
        seasonYear
        status
        siteUrl
      }
    }
  }
`;
