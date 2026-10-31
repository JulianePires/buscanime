import { screen, within } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { clickAndWait, renderWithCatalog } from "./test/apollo";
import { buildPageData } from "./test/fixtures/anime-page";
import { anilist } from "./test/msw/handlers";
import { server } from "./test/msw/server";

const LOGO_SRC = "/brand/logo.svg";
const TWELVE_IDS = Array.from({ length: 12 }, (_, index) => index + 1);

describe("UC01 - Visualizar estrutura da página", () => {
  it("exibe o logo na navegação principal com link para a página inicial", async () => {
    await renderWithCatalog(<App />);

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    const brand = within(navigation).getByRole("link", { name: "Buscanime" });

    expect(brand).toBeVisible();
    expect(brand).toHaveAttribute("href", "/");
    expect(brand.querySelector("img")).toHaveAttribute("src", LOGO_SRC);
  });

  it("exibe o título principal na área de conteúdo", async () => {
    await renderWithCatalog(<App />);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("exibe o logo e a legenda no rodapé", async () => {
    await renderWithCatalog(<App />);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("TODOS OS DIREITOS RESERVADOS")).toBeInTheDocument();
    expect(footer.querySelector("img")).toHaveAttribute("src", LOGO_SRC);
  });

  it("organiza a página na ordem cabeçalho, conteúdo e rodapé", async () => {
    await renderWithCatalog(<App />);

    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");

    expect(header).toContainElement(screen.getByRole("navigation"));
    expect(header.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(main.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

describe("UC02 - Visualizar listagem de animes", () => {
  describe("Dado que existem animes disponíveis", () => {
    describe("Quando o visitante acessar a área de listagem", () => {
      it("Então deve visualizar os animes em cards ou itens identificáveis", async () => {
        server.use(
          anilist.query("AnimePage", async () => {
            await delay(50);
            return HttpResponse.json({ data: buildPageData({ ids: TWELVE_IDS }) });
          }),
        );
        await renderWithCatalog(<App />);

        expect(screen.getByRole("status")).toHaveTextContent("Carregando animes");

        const list = await screen.findByRole("list", { name: "Animes" });
        const cards = within(list).getAllByRole("article");
        expect(cards).toHaveLength(12);
        expect(list.children).toHaveLength(12);
        expect(within(cards[0]).getByRole("heading")).toHaveTextContent("Anime 1");
        expect(screen.queryByText("Carregando animes")).not.toBeInTheDocument();
      });
    });
  });

  describe("Dado que um anime listado possui nota média", () => {
    describe("Quando o card desse anime for exibido", () => {
      it.each([
        [49, "danger"],
        [80, "warning"],
        [81, "success"],
      ])("Então a nota %i aparece em percentual com o tom %s", async (averageScore, tone) => {
        server.use(
          anilist.query("AnimePage", () =>
            HttpResponse.json({ data: buildPageData({ ids: [1], overrides: { averageScore } }) }),
          ),
        );
        await renderWithCatalog(<App />);

        const score = await screen.findByText(`${averageScore}%`);
        expect(score.closest("[data-tone]")).toHaveAttribute("data-tone", tone);
      });
    });
  });

  describe("Dado que a API não retornou animes", () => {
    describe("Quando a listagem terminar de carregar", () => {
      it("Então deve exibir uma mensagem de lista vazia", async () => {
        server.use(
          anilist.query("AnimePage", () => HttpResponse.json({ data: buildPageData({ ids: [] }) })),
        );
        await renderWithCatalog(<App />);

        expect(await screen.findByText("Nenhum anime encontrado.")).toBeInTheDocument();
        expect(screen.queryByRole("list", { name: "Animes" })).not.toBeInTheDocument();
      });
    });
  });

  describe("Dado que a API falhou", () => {
    // O React registra no console todo erro capturado por um boundary
    beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => undefined));
    afterEach(() => vi.restoreAllMocks());

    describe("Quando a listagem tentar carregar", () => {
      it("Então deve exibir uma mensagem de erro com a opção de tentar novamente", async () => {
        const serverError = (): Response =>
          new HttpResponse("Internal Server Error", { status: 500 });
        let calls = 0;
        server.use(
          anilist.query("AnimePage", () => {
            calls += 1;
            return calls === 1
              ? serverError()
              : HttpResponse.json({ data: buildPageData({ ids: TWELVE_IDS }) });
          }),
        );
        await renderWithCatalog(<App />);

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("Não foi possível carregar os animes.");

        await clickAndWait(within(alert).getByRole("button", { name: "Tentar novamente" }));

        const list = await screen.findByRole("list", { name: "Animes" });
        expect(within(list).getAllByRole("article")).toHaveLength(12);
        expect(calls).toBe(2);
      });
    });
  });
});
