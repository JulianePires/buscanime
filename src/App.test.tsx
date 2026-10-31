import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { FORMAT_OPTIONS } from "./domain/formats";
import { clickAndWait, renderWithCatalog } from "./test/apollo";
import { buildMedia, buildPageData } from "./test/fixtures/anime-page";
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

        const list = await screen.findByRole("list", { name: /Animes/ });
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

        const list = await screen.findByRole("list", { name: /Animes/ });
        expect(within(list).getAllByRole("article")).toHaveLength(12);
        expect(calls).toBe(2);
      });
    });
  });
});

describe("UC04 - Filtrar lista por um ou mais formatos", () => {
  const [ALL_FORMATS, , MOVIE, , , OVA] = FORMAT_OPTIONS.map((option) => option.label);

  /** Acervo com formatos diferentes; o handler aplica o format_in como o AniList. */
  const CATALOG = [
    { id: 1, format: "TV" },
    { id: 2, format: "MOVIE" },
    { id: 3, format: "OVA" },
    { id: 4, format: "MOVIE" },
  ] as const;

  function formatAwareApi({ delayMs = 0 } = {}) {
    const requests: (string[] | undefined)[] = [];
    server.use(
      anilist.query("AnimePage", async ({ variables }) => {
        const formats: string[] | undefined = variables.formats;
        requests.push(formats);
        await delay(delayMs);
        const page = buildPageData({ ids: [] });
        page.Page!.media = CATALOG.filter((item) => !formats || formats.includes(item.format)).map(
          (item) => buildMedia(item.id, { format: item.format }),
        );
        return HttpResponse.json({ data: page });
      }),
    );
    return requests;
  }

  async function renderCatalog(options?: { delayMs: number }) {
    const requests = formatAwareApi(options);
    await renderWithCatalog(<App />);
    await screen.findByText("Anime 3");
    return requests;
  }

  const select = (name: string) => clickAndWait(screen.getByRole("button", { name }));
  const animeList = () => screen.getByRole("list", { name: "Animes" });
  const listed = () =>
    within(animeList())
      .getAllByRole("heading")
      .map((heading) => heading.textContent);
  const pressed = () =>
    within(screen.getByRole("group", { name: "Formato" }))
      .getAllByRole("button", { pressed: true })
      .map((button) => button.textContent);

  describe("Dado que existem animes de formatos diferentes", () => {
    describe("Quando o visitante selecionar um ou mais formatos", () => {
      it("Então a listagem deve exibir somente os animes compatíveis", async () => {
        const requests = await renderCatalog();

        await select(MOVIE);
        await waitFor(() => expect(listed()).toEqual(["Anime 2", "Anime 4"]));
        expect(pressed()).toEqual([MOVIE]);

        await select(OVA);
        await waitFor(() => expect(listed()).toEqual(["Anime 2", "Anime 3", "Anime 4"]));
        expect(pressed()).toEqual([MOVIE, OVA]);
        expect(requests).toEqual([undefined, ["MOVIE"], ["MOVIE", "OVA"]]);
      });

      it("Então o botão fica marcado na hora e a lista anterior continua visível enquanto carrega", async () => {
        await renderCatalog({ delayMs: 100 });

        await select(MOVIE);

        expect(pressed()).toEqual([MOVIE]);
        expect(animeList()).toHaveAttribute("aria-busy", "true");
        expect(listed()).toContain("Anime 1");

        await waitFor(() => expect(listed()).not.toContain("Anime 1"));
        expect(animeList()).not.toHaveAttribute("aria-busy");
      });
    });
  });

  describe("Dado que há formatos selecionados", () => {
    describe('Quando o visitante acionar "All Formats"', () => {
      it("Então a seleção deve ser limpa E a listagem deve exibir animes de todos os formatos", async () => {
        const requests = await renderCatalog();
        await select(MOVIE);
        await waitFor(() => expect(listed()).not.toContain("Anime 1"));

        await select(ALL_FORMATS);

        await waitFor(() => expect(listed()).toEqual(["Anime 1", "Anime 2", "Anime 3", "Anime 4"]));
        expect(pressed()).toEqual([ALL_FORMATS]);
        // A combinação sem formatos já estava no cache: nenhuma requisição nova
        await act(() => delay(20));
        expect(requests).toEqual([undefined, ["MOVIE"]]);
      });
    });
  });
});

describe("UC03 - Visualizar detalhe do anime listado", () => {
  const PAGE_TITLE = "Buscanime | Busca de animes";

  // O <title> do index.html não existe no jsdom
  beforeEach(() => {
    document.title = PAGE_TITLE;
  });

  /** Uma página com três animes; conta as requisições para provar que o detalhe vem do cache. */
  function countingApi() {
    const api = { calls: 0 };
    server.use(
      anilist.query("AnimePage", () => {
        api.calls += 1;
        return HttpResponse.json({ data: buildPageData({ ids: [1, 2, 3] }) });
      }),
    );
    return api;
  }

  async function openDetail(title: string) {
    await renderWithCatalog(<App />);
    const card = await screen.findByRole("button", { name: title });
    fireEvent.click(card);
    return { card, dialog: screen.getByRole("dialog", { name: title }) };
  }

  describe("Dado que a listagem contém um anime", () => {
    describe("Quando o visitante selecionar esse anime", () => {
      it("Então deve visualizar seus dados detalhados em um modal", async () => {
        const api = countingApi();
        const { dialog } = await openDetail("Anime 2");

        expect(dialog).toHaveAttribute("open");
        expect(within(dialog).getByText("Anime 2 (EN)")).toBeInTheDocument();
        expect(within(dialog).getByText("Sinopse do anime 2.")).toBeInTheDocument();
        expect(within(dialog).getByText("TV Show")).toBeInTheDocument();
        expect(document.title).toBe("Anime 2 | Buscanime");

        // O Media:2 já está normalizado no cache: abrir o detalhe não chama a rede
        await act(() => delay(20));
        expect(api.calls).toBe(1);
      });
    });
  });

  describe("Dado que o modal de detalhe está aberto", () => {
    const closeWith = {
      Esc: (dialog: HTMLElement) => fireEvent.keyDown(dialog, { key: "Escape" }),
      Fechar: (dialog: HTMLElement) =>
        fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" })),
    };

    describe.each(Object.keys(closeWith) as (keyof typeof closeWith)[])(
      'Quando o visitante pressionar Esc ou acionar "Fechar" (%s)',
      (action) => {
        it("Então o modal deve fechar E o foco deve voltar para o card selecionado", async () => {
          countingApi();
          const { card, dialog } = await openDetail("Anime 3");

          closeWith[action](dialog);

          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
          expect(card).toHaveFocus();
          expect(document.title).toBe(PAGE_TITLE);
        });
      },
    );
  });
});
