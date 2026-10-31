import { afterEach, describe, expect, it, vi } from "vitest";
import { pageSizeForWidth } from "../../domain/page-size";
import { initialCatalogFilters } from "../../features/catalog/catalog-filters-reducer";
import { buildPageData } from "../../test/fixtures/anime-page";
import { resizeViewport } from "../../test/viewport";
import { ANILIST_URL } from "./apollo-client";
import {
  animePagePrefetchConfig,
  animePagePrefetchScript,
  takePrefetchedResponse,
} from "./prefetch";

const PRELOAD = "link[rel=preload]";
const config = animePagePrefetchConfig(initialCatalogFilters, ANILIST_URL);

/** Roda o script como o navegador: o texto serializado, sem acesso ao escopo deste módulo. */
function runInlineScript() {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ data: buildPageData({ ids: [7] }) }),
  );
  vi.stubGlobal("fetch", fetch);
  // Avaliar o texto gerado é o objetivo: prova que a função serializada é autocontida
  // eslint-disable-next-line sonarjs/code-eval
  new Function(animePagePrefetchScript(config))();
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.__ANIME_PAGE_PREFETCH__;
  document.head.querySelectorAll(PRELOAD).forEach((link) => {
    link.remove();
  });
});

describe("animePagePrefetchConfig (gerado no build)", () => {
  it("usa a consulta como o Apollo a envia (com __typename) e as variáveis da primeira página", () => {
    expect(config.query).toMatch(/^query AnimePage\(/);
    expect(config.query).toContain("__typename");
    expect(config.variables).toEqual({ page: 1, perPage: 12, sort: ["POPULARITY_DESC"] });
  });
});

describe("animePagePrefetchScript (inline no index.html)", () => {
  it("pede a primeira página antes do JS, em campos de formulário (sem preflight)", async () => {
    await resizeViewport(375);

    const fetch = runInlineScript();

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(config.url);
    expect(init?.method).toBe("POST");
    const form = init?.body as URLSearchParams;
    expect(form).toBeInstanceOf(URLSearchParams);
    expect(form.get("operationName")).toBe("AnimePage");
    expect(form.get("query")).toBe(config.query);
    expect(JSON.parse(form.get("variables") ?? "")).toEqual({ ...config.variables, perPage: 3 });
  });

  it.each([320, 600, 601, 919, 920, 1219, 1220, 1920])(
    "a %i px usa o mesmo tamanho de página da aplicação",
    async (width) => {
      await resizeViewport(width);

      const fetch = runInlineScript();

      const form = fetch.mock.calls[0][1]?.body as URLSearchParams;
      expect(JSON.parse(form.get("variables") ?? "").perPage).toBe(pageSizeForWidth(width));
    },
  );

  it("pré-carrega a capa do primeiro anime com prioridade alta (LCP)", async () => {
    runInlineScript();

    await vi.waitFor(() => expect(document.head.querySelector(PRELOAD)).not.toBeNull());
    const link = document.head.querySelector<HTMLLinkElement>(PRELOAD);
    expect(link?.as).toBe("image");
    expect(link?.href).toBe("https://img.anili.st/media/7.jpg");
    expect(link?.getAttribute("fetchpriority")).toBe("high");
  });
});

describe("takePrefetchedResponse", () => {
  const variables = { ...config.variables, perPage: 12 };

  it("entrega a resposta antecipada uma vez só, para a mesma operação e variáveis", async () => {
    runInlineScript();

    const response = takePrefetchedResponse("AnimePage", variables);

    expect(await (await response)?.json()).toEqual({ data: buildPageData({ ids: [7] }) });
    expect(takePrefetchedResponse("AnimePage", variables)).toBeUndefined();
  });

  it("ignora a antecipação quando as variáveis não batem (ex.: outra largura)", () => {
    runInlineScript();

    expect(takePrefetchedResponse("AnimePage", { ...variables, perPage: 6 })).toBeUndefined();
  });

  it("sem script inline (testes, dev), não há resposta antecipada", () => {
    expect(takePrefetchedResponse("AnimePage", variables)).toBeUndefined();
  });
});
