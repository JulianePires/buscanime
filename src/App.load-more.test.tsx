import { screen, waitFor, within } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "./App";
import { clickAndWait, renderWithCatalog } from "./test/apollo";
import { buildPageData } from "./test/fixtures/anime-page";
import { anilist } from "./test/msw/handlers";
import { server } from "./test/msw/server";
import { resizeViewport } from "./test/viewport";

// UC06 fica fora do App.test.tsx para os arquivos caberem no limite de linhas do ESLint

const TOTAL = 36;
// Tipado como Response: o handler GraphQL do msw só aceita corpo JSON no HttpResponse
const serverError = (): Response => new HttpResponse("Internal Server Error", { status: 500 });

/** Acervo de 36 animes paginado como o AniList; `failPages` responde 500 uma vez por página. */
function pagedApi({ failPages = [] as number[] } = {}) {
  const requests: Record<string, unknown>[] = [];
  const failed = new Set<number>();
  server.use(
    anilist.query("AnimePage", ({ variables }) => {
      requests.push(variables);
      const { page, perPage } = variables as { page: number; perPage: number };
      if (failPages.includes(page) && !failed.has(page)) {
        failed.add(page);
        return serverError();
      }
      const first = (page - 1) * perPage + 1;
      const last = Math.min(page * perPage, TOTAL);
      const ids = Array.from({ length: last - first + 1 }, (_, index) => first + index);
      return HttpResponse.json({
        data: buildPageData({ ids, currentPage: page, hasNextPage: last < TOTAL }),
      });
    }),
  );
  return requests;
}

async function renderCatalog(options?: Parameters<typeof pagedApi>[0]) {
  const requests = pagedApi(options);
  await renderWithCatalog(<App />);
  await screen.findByText("Anime 12");
  return requests;
}

const cards = () => within(screen.getByRole("list", { name: "Animes" })).getAllByRole("article");
const loadMoreButton = () => screen.queryByRole("button", { name: "Ver mais" });
const loadMore = () => clickAndWait(loadMoreButton()!);

describe("UC06 - Carregar mais animes pelo Ver mais", () => {
  describe("Dado que a primeira página de animes foi carregada", () => {
    describe('Quando o visitante acionar o botão "Ver mais" ao final da listagem', () => {
      it("Então o sistema deve carregar a próxima página sem recarregar a tela E deve manter os animes já exibidos", async () => {
        const requests = await renderCatalog();
        const [firstCard] = cards();
        expect(cards()).toHaveLength(12);

        await loadMore();

        await waitFor(() => expect(cards()).toHaveLength(24));
        // O mesmo nó: a lista cresceu, não foi recriada
        expect(cards()[0]).toBe(firstCard);
        expect(requests.map((variables) => variables.page)).toEqual([1, 2]);
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });

      it("Então o foco vai para o primeiro card novo (13º)", async () => {
        await renderCatalog();

        await loadMore();

        await waitFor(() => expect(screen.getByRole("button", { name: "Anime 13" })).toHaveFocus());
      });
    });
  });

  describe('Dado que não há mais páginas / Quando a última página for carregada / Então o botão "Ver mais" não deve ser exibido', () => {
    it("esconde o botão depois da terceira página", async () => {
      await renderCatalog();
      await loadMore();
      await screen.findByText("Anime 24");
      expect(loadMoreButton()).toBeInTheDocument();

      await loadMore();

      await screen.findByText("Anime 36");
      expect(loadMoreButton()).not.toBeInTheDocument();
      expect(cards()).toHaveLength(TOTAL);
    });
  });

  describe("Dado que a página seguinte falhou", () => {
    it('Então mantém os animes exibidos e "Tentar novamente" carrega a página', async () => {
      await renderCatalog({ failPages: [2] });

      await loadMore();

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Não foi possível carregar mais animes.");
      expect(cards()).toHaveLength(12);
      expect(loadMoreButton()).toBeInTheDocument();

      await clickAndWait(within(alert).getByRole("button", { name: "Tentar novamente" }));

      await waitFor(() => expect(cards()).toHaveLength(24));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});

describe("Tamanho da página por largura de tela", () => {
  it.each([
    [375, 3],
    [700, 6],
    [1000, 9],
    [1366, 12],
  ])("a %i px pede e mostra %i animes por página", async (width, perPage) => {
    await resizeViewport(width);
    const requests = pagedApi();

    await renderWithCatalog(<App />);

    await screen.findByText(`Anime ${perPage}`);
    expect(cards()).toHaveLength(perPage);
    expect(requests).toEqual([expect.objectContaining({ page: 1, perPage })]);
  });

  it("o esqueleto de carregamento reserva o tamanho da página", async () => {
    await resizeViewport(375);
    server.use(
      anilist.query("AnimePage", async () => {
        await delay(50);
        return HttpResponse.json({ data: buildPageData({ ids: [1, 2, 3] }) });
      }),
    );

    await renderWithCatalog(<App />);

    expect(screen.getByRole("status").querySelectorAll("[data-skeleton]")).toHaveLength(3);
  });

  it("ao cruzar uma faixa, recarrega da primeira página com o novo tamanho", async () => {
    const requests = await renderCatalog();

    await resizeViewport(700);

    await waitFor(() => expect(cards()).toHaveLength(6));
    expect(requests.at(-1)).toMatchObject({ page: 1, perPage: 6 });
  });

  it("redimensionar dentro da mesma faixa não faz nova requisição", async () => {
    const requests = await renderCatalog();

    await resizeViewport(1500);

    expect(cards()).toHaveLength(12);
    expect(requests).toHaveLength(1);
  });
});
