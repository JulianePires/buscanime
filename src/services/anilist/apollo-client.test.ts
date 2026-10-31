import { CombinedGraphQLErrors, ServerError } from "@apollo/client";
import { HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPageData } from "../../test/fixtures/anime-page";
import { anilist } from "../../test/msw/handlers";
import { server } from "../../test/msw/server";
import { ANILIST_URL, createApolloClient } from "./apollo-client";
import { toAnimePageVariables } from "./mappers";
import { ANIME_PAGE } from "./queries/page.graphql";

const allFormats = { formats: [], perPage: 12 };

function queryPage(variables = toAnimePageVariables(allFormats)) {
  // Em JSON, que o MSW lê; o formulário tem teste próprio abaixo
  return createApolloClient({ logErrors: false, formEncoded: false }).query({
    query: ANIME_PAGE,
    variables,
  });
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

describe("Dado o navegador / Quando a lista é pedida", () => {
  /** fetch falso: guarda o Request que o HttpLink montou, sem passar pelo msw. */
  async function sentRequest() {
    const requests: Request[] = [];
    const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      return Promise.resolve(HttpResponse.json({ data: buildPageData({ ids: [1] }) }));
    };
    await createApolloClient({ logErrors: false, fetch }).query({
      query: ANIME_PAGE,
      variables: toAnimePageVariables(allFormats),
    });
    return requests[0];
  }

  it("Então envia campos de formulário: requisição simples, sem preflight de CORS", async () => {
    const request = await sentRequest();

    expect(request.method).toBe("POST");
    expect(request.headers.get("content-type")).toMatch(/^application\/x-www-form-urlencoded/);
    // Só cabeçalhos da lista segura do CORS: nenhum dispara o OPTIONS
    const names: string[] = [];
    request.headers.forEach((_, name) => {
      names.push(name);
    });
    expect(names.sort()).toEqual(["accept", "content-type"]);
    const form = new URLSearchParams(await request.text());
    expect(form.get("operationName")).toBe("AnimePage");
    expect(form.get("query")).toContain("query AnimePage");
    expect(JSON.parse(form.get("variables") ?? "")).toEqual({
      page: 1,
      perPage: 12,
      sort: ["POPULARITY_DESC"],
    });
  });
});

describe("Dado que o index.html já pediu a primeira página (prefetch)", () => {
  const variables = toAnimePageVariables(allFormats);
  // Uma falha antes do consumo deixaria a antecipação para o próximo teste
  afterEach(() => {
    delete window.__ANIME_PAGE_PREFETCH__;
  });
  const prefetched = (response: Promise<Response>) => {
    window.__ANIME_PAGE_PREFETCH__ = { variables: JSON.stringify(variables), response };
  };

  function queryWith(fetch: typeof globalThis.fetch) {
    return createApolloClient({ logErrors: false, fetch }).query({ query: ANIME_PAGE, variables });
  }

  it("Então o Apollo usa essa resposta, sem outra requisição", async () => {
    prefetched(Promise.resolve(Response.json({ data: buildPageData({ ids: [42] }) })));
    const fetch = vi.fn<typeof globalThis.fetch>();

    const { data } = await queryWith(fetch);

    expect(fetch).not.toHaveBeenCalled();
    expect(data?.Page?.media?.[0]?.id).toBe(42);
  });

  it("Quando a antecipação falhou na rede, Então faz a requisição normal", async () => {
    prefetched(Promise.reject(new TypeError("Failed to fetch")));
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ data: buildPageData({ ids: [1] }) }),
    );

    const { data } = await queryWith(fetch);

    expect(fetch).toHaveBeenCalledOnce();
    expect(data?.Page?.media?.[0]?.id).toBe(1);
  });
});
