import { fireEvent, render, screen } from "@testing-library/react";
import { HttpResponse } from "msw";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCatalog, useCatalogRetry } from "../../features/catalog/use-catalog";
import { clickAndWait, renderWithCatalog } from "../../test/apollo";
import { buildPageData } from "../../test/fixtures/anime-page";
import { anilist } from "../../test/msw/handlers";
import { server } from "../../test/msw/server";
import { ErrorBoundary } from "./ErrorBoundary";

const retryButton = () => screen.findByRole("button", { name: "Tentar novamente" });

describe("ErrorBoundary", () => {
  // O React registra no console todo erro capturado por um boundary
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => undefined));
  afterEach(() => vi.restoreAllMocks());

  it("mostra o erro com a opção de tentar novamente e reinicia os filhos", async () => {
    let shouldThrow = true;
    function Unstable() {
      if (shouldThrow) throw new Error("falhou");
      return <p>Recuperado</p>;
    }
    const onReset = vi.fn(() => {
      shouldThrow = false;
    });
    render(
      <ErrorBoundary onReset={onReset}>
        <Unstable />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar");
    fireEvent.click(await retryButton());

    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.getByText("Recuperado")).toBeInTheDocument();
  });

  describe("Dado que a API responde com erro GraphQL, HTTP 500 ou HTTP 429", () => {
    function Titles() {
      const { animes } = useCatalog();
      return <p>{animes.map((anime) => anime.title).join(", ")}</p>;
    }

    function Screen() {
      const retry = useCatalogRetry();
      return (
        <ErrorBoundary onReset={retry}>
          <Suspense fallback={<p>Carregando animes</p>}>
            <Titles />
          </Suspense>
        </ErrorBoundary>
      );
    }

    const failures: [string, () => Response][] = [
      ["erro GraphQL", () => HttpResponse.json({ data: null, errors: [{ message: "Falhou" }] })],
      ["HTTP 500", () => new HttpResponse("Internal Server Error", { status: 500 })],
      ["HTTP 429", () => new HttpResponse("Too Many Requests", { status: 429 })],
    ];

    it.each(failures)(
      "%s: Quando a query é executada, Então o erro chega ao Error Boundary e tentar novamente refaz a requisição",
      async (_, failure) => {
        let calls = 0;
        server.use(
          anilist.query("AnimePage", () => {
            calls += 1;
            return calls === 1
              ? failure()
              : HttpResponse.json({ data: buildPageData({ ids: [1, 2] }) });
          }),
        );
        await renderWithCatalog(<Screen />);

        await clickAndWait(await retryButton());

        expect(await screen.findByText("Anime 1, Anime 2")).toBeInTheDocument();
        expect(calls).toBe(2);
      },
    );
  });
});
