import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "./App";
import { clickAndWait, renderWithCatalog } from "./test/apollo";
import { buildMedia, buildPageData } from "./test/fixtures/anime-page";
import { anilist } from "./test/msw/handlers";
import { server } from "./test/msw/server";

// UC09: os filtros aplicados ficam na URL (q e format); o setup volta a URL para "/" a cada teste

const FILM_RED = "One Piece Film: Red";

const CATALOG = [
  { id: 1, title: "One Piece", format: "TV" },
  { id: 2, title: FILM_RED, format: "MOVIE" },
  { id: 3, title: "Naruto", format: "TV" },
] as const;

function searchAwareApi() {
  const requests: Record<string, unknown>[] = [];
  server.use(
    anilist.query("AnimePage", ({ variables }) => {
      requests.push(variables);
      const search: string | undefined = variables.search;
      const formats: string[] | undefined = variables.formats;
      const page = buildPageData({ ids: [] });
      page.Page!.media = CATALOG.filter(
        (item) =>
          (!search || item.title.toLowerCase().includes(search.toLowerCase())) &&
          (!formats || formats.includes(item.format)),
      ).map((item) =>
        buildMedia(item.id, {
          title: { __typename: "MediaTitle", romaji: item.title, english: null },
        }),
      );
      return HttpResponse.json({ data: page });
    }),
  );
  return requests;
}

async function openAt(url: string) {
  window.history.replaceState(null, "", url);
  const requests = searchAwareApi();
  await renderWithCatalog(<App />);
  await screen.findByRole("list", { name: "Animes" });
  return requests;
}

const searchbox = () => screen.getByRole("searchbox", { name: "Buscar anime" });
const formatButton = (name: string) =>
  within(screen.getByRole("group", { name: "Formato" })).getByRole("button", { name });

const pressedFormats = () =>
  within(screen.getByRole("group", { name: "Formato" }))
    .getAllByRole("button", { pressed: true })
    .map((button) => button.textContent);

async function searchFor(term: string) {
  fireEvent.change(searchbox(), { target: { value: term } });
  await clickAndWait(screen.getByRole("button", { name: "Buscar" }));
}

const listed = () =>
  within(screen.getByRole("list", { name: "Animes" }))
    .getAllByRole("heading")
    .map((heading) => heading.textContent);

/** Voltar do navegador: o jsdom dispara o popstate depois, fora da chamada. */
async function goBack() {
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener("popstate", resolve, { once: true }),
    );
    window.history.back();
    await popped;
  });
}

describe("UC09 - Compartilhar e restaurar os filtros pela URL", () => {
  describe("Dado que o visitante buscou um texto e selecionou formatos", () => {
    describe("Quando a listagem for atualizada", () => {
      it("Então a URL deve conter o texto e os formatos como query params", async () => {
        await openAt("/");
        const entries = window.history.length;

        await clickAndWait(formatButton("Movie"));
        await waitFor(() => expect(window.location.search).toBe("?format=MOVIE"));
        await searchFor("  one piece ");

        await waitFor(() => expect(window.location.search).toBe("?q=one+piece&format=MOVIE"));
        expect(listed()).toEqual([FILM_RED]);
        // Cada combinação é uma entrada no histórico (pushState)
        expect(window.history).toHaveLength(entries + 2);
      });

      it('Quando volta para "All Formats" e busca vazio, Então a URL fica sem query string', async () => {
        await openAt("/?q=naruto&format=TV");

        await clickAndWait(formatButton("All Formats"));
        await searchFor("");

        await waitFor(() => expect(window.location.search).toBe(""));
        expect(window.location.pathname).toBe("/");
      });
    });
  });

  describe("Dado um link com texto e formatos nos query params", () => {
    describe("Quando o visitante abrir o link", () => {
      it("Então os filtros devem vir preenchidos e a listagem já filtrada", async () => {
        const requests = await openAt("/?q=one+piece&format=TV&format=MOVIE");

        expect(searchbox()).toHaveValue("one piece");
        expect(pressedFormats()).toEqual(["TV Show", "Movie"]);
        expect(listed()).toEqual(["One Piece", FILM_RED]);
        // Uma requisição só, já com os filtros do link
        expect(requests).toEqual([
          expect.objectContaining({
            search: "one piece",
            formats: ["TV", "MOVIE"],
            sort: ["SEARCH_MATCH"],
          }),
        ]);
      });

      it("Quando o link tem valores inválidos, Então são ignorados e a URL é corrigida sem nova entrada", async () => {
        const entries = window.history.length;

        const requests = await openAt("/?q=%20%20naruto%20&format=MANGA&format=tv&utm_source=x");

        expect(requests[0]).toMatchObject({ search: "naruto", formats: ["TV"] });
        await waitFor(() =>
          expect(window.location.search).toBe("?utm_source=x&q=naruto&format=TV"),
        );
        expect(window.history).toHaveLength(entries);
      });
    });
  });

  describe("Dado que o visitante mudou os filtros", () => {
    describe("Quando usar o voltar do navegador", () => {
      it("Então os filtros, o campo e a listagem anteriores devem voltar", async () => {
        const requests = await openAt("/");
        await searchFor("naruto");
        await waitFor(() => expect(window.location.search).toBe("?q=naruto"));
        await clickAndWait(formatButton("Movie"));
        await waitFor(() => expect(window.location.search).toBe("?q=naruto&format=MOVIE"));

        await goBack();

        await waitFor(() => expect(listed()).toEqual(["Naruto"]));
        expect(pressedFormats()).toEqual(["All Formats"]);
        expect(searchbox()).toHaveValue("naruto");

        await goBack();

        await waitFor(() => expect(listed()).toHaveLength(CATALOG.length));
        expect(searchbox()).toHaveValue("");
        expect(window.location.search).toBe("");
        // As duas combinações já estavam no cache: voltar não vai à rede
        expect(requests).toHaveLength(3);
      });
    });
  });
});
