import { CombinedGraphQLErrors, ServerError } from "@apollo/client";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { buildPageData } from "../../test/fixtures/anime-page";
import { anilist } from "../../test/msw/handlers";
import { server } from "../../test/msw/server";
import { ANILIST_URL, createApolloClient } from "./apollo-client";
import { toAnimePageVariables } from "./mappers";
import { ANIME_PAGE } from "./queries/page.graphql";

const allFormats = { formats: [], perPage: 12 };

function queryPage(variables = toAnimePageVariables(allFormats)) {
  return createApolloClient({ logErrors: false }).query({ query: ANIME_PAGE, variables });
}

/** Responde sempre com `response` e conta as chamadas recebidas. */
function respondWith(response: () => Response) {
  const calls: { method: string; url: string; body: Record<string, unknown> }[] = [];
  server.use(
    anilist.query("AnimePage", async ({ request }) => {
      calls.push({ method: request.method, url: request.url, body: await request.json() });
      return response();
    }),
  );
  return calls;
}

describe("createApolloClient", () => {
  it("envia a operação AnimePage por POST para graphql.anilist.co", async () => {
    const calls = respondWith(() => HttpResponse.json({ data: buildPageData({ ids: [1] }) }));

    await queryPage();

    expect(ANILIST_URL).toBe("https://graphql.anilist.co");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "POST", body: { operationName: "AnimePage" } });
    expect(new URL(calls[0].url).origin).toBe(ANILIST_URL);
  });

  it("omite search e formats quando os filtros estão vazios", async () => {
    const calls = respondWith(() => HttpResponse.json({ data: buildPageData({ ids: [1] }) }));

    await queryPage();

    expect(calls[0].body.variables).toEqual({ page: 1, perPage: 12, sort: ["POPULARITY_DESC"] });
  });

  it("envia search, formats e a ordenação por relevância quando há filtros", async () => {
    const calls = respondWith(() => HttpResponse.json({ data: buildPageData({ ids: [1] }) }));

    await queryPage(
      toAnimePageVariables({ formats: ["TV", "MOVIE"], search: "naruto", perPage: 24 }),
    );

    expect(calls[0].body.variables).toEqual({
      page: 1,
      perPage: 24,
      search: "naruto",
      formats: ["TV", "MOVIE"],
      sort: ["SEARCH_MATCH"],
    });
  });

  describe("Dado que a API responde com erro", () => {
    it("erro GraphQL vira CombinedGraphQLErrors", async () => {
      respondWith(() => HttpResponse.json({ data: null, errors: [{ message: "Not Found." }] }));

      const error = await queryPage().catch((reason: unknown) => reason);

      expect(CombinedGraphQLErrors.is(error)).toBe(true);
    });

    it.each([500, 429])("HTTP %i vira ServerError", async (status) => {
      respondWith(() => new HttpResponse("Falha", { status }));

      const error = await queryPage().catch((reason: unknown) => reason);

      expect(ServerError.is(error)).toBe(true);
      expect(ServerError.is(error) && error.statusCode).toBe(status);
    });

    it("HTTP 429 (rate limit) não é reenviado automaticamente", async () => {
      const calls = respondWith(() => new HttpResponse("Too Many Requests", { status: 429 }));

      await queryPage().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(calls).toHaveLength(1);
    });
  });
});
