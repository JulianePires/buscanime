import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "./App";
import { SEARCH_DEBOUNCE_MS } from "./components/filters/SearchBar";
import { clickAndWait, renderWithCatalog } from "./test/apollo";
import { buildMedia, buildPageData } from "./test/fixtures/anime-page";
import { anilist } from "./test/msw/handlers";
import { server } from "./test/msw/server";

// UC05 fica fora do App.test.tsx para os dois arquivos caberem no limite de linhas do ESLint

const ONE_PIECE = "one piece";
const FILM_RED = "One Piece Film: Red";

/** Acervo com títulos e formatos; o handler aplica search e format_in como o AniList. */
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
          format: item.format,
        }),
      );
      return HttpResponse.json({ data: page });
    }),
  );
  return requests;
}

async function renderCatalog() {
  const requests = searchAwareApi();
  await renderWithCatalog(<App />);
  await screen.findByText("Naruto");
  return requests;
}

async function searchFor(term: string) {
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar anime" }), {
    target: { value: term },
  });
  await clickAndWait(screen.getByRole("button", { name: "Buscar" }));
}

const listed = () =>
  within(screen.getByRole("list", { name: "Animes" }))
    .getAllByRole("heading")
    .map((heading) => heading.textContent);

const emptyMessage = async () => (await screen.findByRole("status")).textContent;

describe("UC05 - Filtrar lista por busca de texto", () => {
  describe("Dado que existem animes cadastrados", () => {
    describe("Quando o visitante informar um texto de busca", () => {
      it("Então a listagem deve exibir os animes correspondentes ao texto", async () => {
        const requests = await renderCatalog();

        await searchFor(`  ${ONE_PIECE} `);

        await waitFor(() => expect(listed()).toEqual(["One Piece", FILM_RED]));
        expect(requests.at(-1)).toMatchObject({
          page: 1,
          search: ONE_PIECE,
          sort: ["SEARCH_MATCH"],
        });
        // O campo não é controlado e não é resetado depois do submit
        expect(screen.getByRole("searchbox")).toHaveValue(`  ${ONE_PIECE} `);
      });

      it("Quando repete a mesma busca, Então não faz nova requisição", async () => {
        const requests = await renderCatalog();
        await searchFor(ONE_PIECE);
        await waitFor(() => expect(listed()).not.toContain("Naruto"));

        await searchFor(`${ONE_PIECE} `);
        await act(() => delay(20));

        expect(requests).toHaveLength(2);
      });

      it("Quando só digita e pausa, Então busca uma vez com o texto final (debounce)", async () => {
        const requests = await renderCatalog();
        const input = screen.getByRole("searchbox", { name: "Buscar anime" });

        for (const value of ["n", "nar", "naruto"]) fireEvent.change(input, { target: { value } });
        await act(() => delay(SEARCH_DEBOUNCE_MS + 50));

        await waitFor(() => expect(listed()).toEqual(["Naruto"]));
        expect(requests).toHaveLength(2);
        expect(requests[1]).toMatchObject({ search: "naruto" });
      });
    });
  });

  describe("Dado que há formatos selecionados", () => {
    describe("Quando o visitante buscar por um texto", () => {
      it("Então a listagem deve respeitar o texto e os formatos ao mesmo tempo", async () => {
        const requests = await renderCatalog();
        await clickAndWait(screen.getByRole("button", { name: "Movie" }));
        await waitFor(() => expect(listed()).toEqual([FILM_RED]));

        await searchFor("naruto");
        expect(await emptyMessage()).toBe('Nenhum anime encontrado para "naruto"');
        expect(requests.at(-1)).toMatchObject({ search: "naruto", formats: ["MOVIE"] });

        await searchFor(ONE_PIECE);
        await waitFor(() => expect(listed()).toEqual([FILM_RED]));
        expect(requests.at(-1)).toMatchObject({ search: ONE_PIECE, formats: ["MOVIE"] });
      });
    });
  });

  describe("Dado que nenhum anime corresponde ao texto", () => {
    describe("Quando a busca terminar", () => {
      it("Então deve exibir a mensagem de lista vazia com o termo pesquisado", async () => {
        await renderCatalog();

        await searchFor("dragon ball");

        expect(await emptyMessage()).toBe('Nenhum anime encontrado para "dragon ball"');
        expect(screen.queryByRole("list", { name: "Animes" })).not.toBeInTheDocument();
      });
    });
  });

  describe("Dado que há um termo buscado", () => {
    describe("Quando o visitante esvaziar o campo e buscar", () => {
      it("Então o filtro de texto sai e a ordenação volta à popularidade", async () => {
        const requests = await renderCatalog();
        await searchFor("naruto");
        await waitFor(() => expect(listed()).toEqual(["Naruto"]));

        await searchFor("   ");

        await waitFor(() => expect(listed()).toHaveLength(CATALOG.length));
        // A lista sem termo já estava no cache
        await act(() => delay(20));
        expect(requests).toHaveLength(2);
        expect(requests[0]).toMatchObject({ sort: ["POPULARITY_DESC"] });
        expect(requests[0]).not.toHaveProperty("search");
      });
    });
  });
});
