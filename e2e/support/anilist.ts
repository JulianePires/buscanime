import type { Page } from "@playwright/test";
import figmaCards from "../../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { buildDetailData, buildMedia, buildPageData } from "../../src/test/fixtures/anime-page";

// PNG 1 × 1 transparente: as capas não saem para a rede
const COVER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Os 12 cards do Figma na resposta do AniList, como no frame Desktop - 2. */
function figmaPage() {
  const page = buildPageData({ ids: [] });
  page.Page!.media = figmaCards.cards.map((card, index) =>
    buildMedia(index + 1, {
      title: { __typename: "MediaTitle", romaji: card.title, english: null },
      genres: card.genres,
      averageScore: card.averageScore,
    }),
  );
  return page;
}

/** Página seguinte (UC06): 12 animes genéricos, com ids depois dos do Figma. */
function nextPage(currentPage: number) {
  return buildPageData({
    ids: Array.from({ length: 12 }, (_, index) => (currentPage - 1) * 12 + index + 1),
  });
}

/** Detalhe (UC08) com o título do card do Figma, para o modal bater com o card aberto. */
function detailData(id: number) {
  const card = figmaCards.cards[id - 1];
  return buildDetailData(id, {
    title: { __typename: "MediaTitle", romaji: card?.title ?? `Anime ${id}`, english: null },
  });
}

/**
 * Mocka a API e as capas. `calls`, `variables`, `contentTypes` e `pageQueries` contam só a
 * listagem (AnimePage); `detailIds` registra as consultas do detalhe (AnimeDetail, UC08). A
 * primeira página traz os cards do Figma; com `pages` > 1 o "Ver mais" encontra as seguintes.
 */
export async function mockAniList(page: Page, { pages = 1 } = {}) {
  const api = {
    calls: 0,
    variables: [] as Record<string, unknown>[],
    contentTypes: [] as string[],
    pageQueries: [] as string[],
    detailIds: [] as number[],
  };
  await page.route("https://graphql.anilist.co/**", (route) => {
    // Corpo em formulário: `variables` chega como texto JSON
    const form = new URLSearchParams(route.request().postData() ?? "");
    const variables = JSON.parse(form.get("variables") ?? "{}");
    if (form.get("operationName") === "AnimeDetail") {
      api.detailIds.push(variables.id);
      return route.fulfill({ json: { data: detailData(variables.id) } });
    }
    api.calls += 1;
    api.variables.push(variables);
    api.pageQueries.push(form.get("query") ?? "");
    api.contentTypes.push(route.request().headers()["content-type"] ?? "");
    const current: number = variables.page ?? 1;
    const data = current === 1 ? figmaPage() : nextPage(current);
    data.Page!.pageInfo = {
      __typename: "PageInfo",
      currentPage: current,
      hasNextPage: current < pages,
    };
    return route.fulfill({ json: { data } });
  });
  await page.route("https://img.anili.st/**", (route) =>
    route.fulfill({ contentType: "image/png", body: COVER }),
  );
  return api;
}
