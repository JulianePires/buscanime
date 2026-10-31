import type { Page } from "@playwright/test";
import figmaCards from "../../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { buildMedia, buildPageData } from "../../src/test/fixtures/anime-page";

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

/** Mocka a API e as capas; devolve o contador de requisições ao GraphQL. */
export async function mockAniList(page: Page) {
  const api = { calls: 0 };
  await page.route("https://graphql.anilist.co/**", (route) => {
    api.calls += 1;
    return route.fulfill({ json: { data: figmaPage() } });
  });
  await page.route("https://img.anili.st/**", (route) =>
    route.fulfill({ contentType: "image/png", body: COVER }),
  );
  return api;
}
