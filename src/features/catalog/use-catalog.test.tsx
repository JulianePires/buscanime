import { act, screen, waitFor } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import { clickAndWait, renderWithCatalog } from "../../test/apollo";
import { buildPageData } from "../../test/fixtures/anime-page";
import { anilist } from "../../test/msw/handlers";
import { server } from "../../test/msw/server";
import { useCatalog } from "./use-catalog";

const LOAD_MORE_FAILED = "Falha ao carregar a próxima página. Tente de novo.";

/** Consumidor mínimo da facade: só vê tipos do domínio. */
function CatalogProbe() {
  const catalog = useCatalog();
  return (
    <>
      <ul>
        {catalog.animes.map((anime) => (
          <li key={anime.id}>{anime.title}</li>
        ))}
      </ul>
      <p>{catalog.hasNextPage ? "há mais" : "fim"}</p>
      <p>{catalog.isLoadingMore ? "carregando mais" : "ocioso"}</p>
      {catalog.loadMoreError && <p>{LOAD_MORE_FAILED}</p>}
      <button type="button" onClick={catalog.loadMore}>
        Ver mais
      </button>
      <button type="button" onClick={() => catalog.toggleFormat("MOVIE")}>
        Movie
      </button>
    </>
  );
}

function renderProbe() {
  return renderWithCatalog(
    <Suspense fallback={<p>Carregando animes</p>}>
      <CatalogProbe />
    </Suspense>,
  );
}

/** Página por variáveis: page 1 → 1..3 (com próxima), page 2 → 3..5 (repete o 3), MOVIE → 10. */
function paginatedApi({ movieDelay = 0, pageDelay = 0 } = {}) {
  const calls: Record<string, unknown>[] = [];
  server.use(
    anilist.query("AnimePage", async ({ variables }) => {
      calls.push(variables);
      if (variables.formats?.includes("MOVIE")) {
        await delay(movieDelay);
        return HttpResponse.json({ data: buildPageData({ ids: [10] }) });
      }
      await delay(pageDelay);
      const data =
        variables.page === 1
          ? buildPageData({ ids: [1, 2, 3], currentPage: 1, hasNextPage: true })
          : buildPageData({ ids: [3, 4, 5], currentPage: 2, hasNextPage: false });
      return HttpResponse.json({ data });
    }),
  );
  return calls;
}

// Tipado como Response: o handler GraphQL do msw só aceita corpo JSON no HttpResponse
const serverError = (): Response => new HttpResponse("Internal Server Error", { status: 500 });

const titles = () => screen.getAllByRole("listitem").map((item) => item.textContent);

describe("useCatalog (facade)", () => {
  describe("Dado que a aplicação inicia / Quando o CatalogProvider monta", () => {
    it("Então os componentes recebem dados do AniList apenas pela facade use-catalog", async () => {
      paginatedApi({ pageDelay: 50 });
      await renderProbe();

      expect(screen.getByText("Carregando animes")).toBeInTheDocument();
      expect(await screen.findByText("Anime 1")).toBeInTheDocument();
      expect(titles()).toEqual(["Anime 1", "Anime 2", "Anime 3"]);
      expect(screen.getByText("há mais")).toBeInTheDocument();
    });
  });

  describe("Dado que a primeira página foi carregada / Quando a página seguinte é pedida", () => {
    it("Então acumula as páginas sem repetir animes e atualiza hasNextPage", async () => {
      const calls = paginatedApi();
      await renderProbe();
      await screen.findByText("Anime 1");

      await clickAndWait(screen.getByRole("button", { name: "Ver mais" }));

      expect(await screen.findByText("Anime 5")).toBeInTheDocument();
      expect(titles()).toEqual(["Anime 1", "Anime 2", "Anime 3", "Anime 4", "Anime 5"]);
      expect(screen.getByText("fim")).toBeInTheDocument();
      expect(screen.getByText("ocioso")).toBeInTheDocument();
      expect(calls.map((variables) => variables.page)).toEqual([1, 2]);
    });

    it("não pede outra página quando não há próxima", async () => {
      const calls = paginatedApi();
      await renderProbe();
      await screen.findByText("Anime 1");
      await clickAndWait(screen.getByRole("button", { name: "Ver mais" }));
      await screen.findByText("fim");

      await clickAndWait(screen.getByRole("button", { name: "Ver mais" }));

      expect(calls).toHaveLength(2);
    });
  });

  describe("Dado que o visitante troca os filtros", () => {
    it("mantém a lista anterior visível enquanto a nova combinação carrega", async () => {
      paginatedApi({ movieDelay: 100 });
      await renderProbe();
      await screen.findByText("Anime 1");

      await clickAndWait(screen.getByRole("button", { name: "Movie" }));

      expect(screen.queryByText("Carregando animes")).not.toBeInTheDocument();
      expect(screen.getByText("Anime 1")).toBeInTheDocument();
      expect(await screen.findByText("Anime 10")).toBeInTheDocument();
    });

    it("Quando volta a uma combinação já vista, Então os dados vêm do cache sem nova requisição", async () => {
      const calls = paginatedApi();
      await renderProbe();
      await screen.findByText("Anime 1");
      await clickAndWait(screen.getByRole("button", { name: "Movie" }));
      await screen.findByText("Anime 10");

      await clickAndWait(screen.getByRole("button", { name: "Movie" }));
      await act(() => delay(20));

      expect(titles()).toEqual(["Anime 1", "Anime 2", "Anime 3"]);
      expect(calls).toHaveLength(2);
    });
  });
});

/** page 1 → 1..3 (com próxima); a page 2 falha na primeira vez e depois responde 4..5. */
function failingNextPageApi() {
  const calls: Record<string, unknown>[] = [];
  server.use(
    anilist.query("AnimePage", ({ variables }) => {
      calls.push(variables);
      if (variables.formats?.includes("MOVIE")) {
        return HttpResponse.json({ data: buildPageData({ ids: [10] }) });
      }
      if (variables.page === 1) {
        return HttpResponse.json({
          data: buildPageData({ ids: [1, 2, 3], currentPage: 1, hasNextPage: true }),
        });
      }
      if (calls.filter((call) => call.page === 2).length === 1) return serverError();
      return HttpResponse.json({
        data: buildPageData({ ids: [4, 5], currentPage: 2, hasNextPage: false }),
      });
    }),
  );
  return calls;
}

/** Primeira página carregada e "Ver mais" com falha. */
async function failLoadingMore() {
  const calls = failingNextPageApi();
  await renderProbe();
  await screen.findByText("Anime 1");
  await clickAndWait(screen.getByRole("button", { name: "Ver mais" }));
  return calls;
}

describe("useCatalog (facade): Dado que a página seguinte falhou", () => {
  it("Então mantém as páginas anteriores e expõe loadMoreError, sem subir ao Error Boundary", async () => {
    await failLoadingMore();

    expect(await screen.findByText(LOAD_MORE_FAILED)).toBeInTheDocument();
    expect(titles()).toEqual(["Anime 1", "Anime 2", "Anime 3"]);
    expect(screen.getByText("há mais")).toBeInTheDocument();
    expect(screen.getByText("ocioso")).toBeInTheDocument();
  });

  it("Quando tenta de novo, Então limpa o erro e carrega a página", async () => {
    const calls = await failLoadingMore();
    await screen.findByText(LOAD_MORE_FAILED);

    await clickAndWait(screen.getByRole("button", { name: "Ver mais" }));

    expect(await screen.findByText("Anime 5")).toBeInTheDocument();
    expect(screen.queryByText(LOAD_MORE_FAILED)).not.toBeInTheDocument();
    expect(titles()).toEqual(["Anime 1", "Anime 2", "Anime 3", "Anime 4", "Anime 5"]);
    expect(calls.map((variables) => variables.page)).toEqual([1, 2, 2]);
  });

  it("Quando troca os filtros, Então o erro da combinação anterior não aparece na nova", async () => {
    await failLoadingMore();
    await screen.findByText(LOAD_MORE_FAILED);

    await clickAndWait(screen.getByRole("button", { name: "Movie" }));

    await waitFor(() => expect(screen.queryByText("Anime 1")).not.toBeInTheDocument());
    expect(screen.queryByText(LOAD_MORE_FAILED)).not.toBeInTheDocument();
  });
});
