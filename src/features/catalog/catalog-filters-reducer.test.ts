import { describe, expect, it } from "vitest";
import { catalogFiltersReducer, initialCatalogFilters } from "./catalog-filters-reducer";

describe("catalogFiltersReducer", () => {
  it("começa sem formatos, sem termo e com 12 itens por página", () => {
    expect(initialCatalogFilters).toEqual({ formats: [], search: undefined, perPage: 12 });
  });

  it("toggleFormat adiciona e remove um formato", () => {
    const withMovie = catalogFiltersReducer(initialCatalogFilters, {
      type: "toggleFormat",
      format: "MOVIE",
    });
    const without = catalogFiltersReducer(withMovie, { type: "toggleFormat", format: "MOVIE" });

    expect(withMovie.formats).toEqual(["MOVIE"]);
    expect(without.formats).toEqual([]);
  });

  it("toggleFormat acumula vários formatos e remove só o escolhido", () => {
    const formats = (["TV", "MOVIE", "OVA"] as const).reduce(
      (state, format) => catalogFiltersReducer(state, { type: "toggleFormat", format }),
      initialCatalogFilters,
    );

    expect(formats.formats).toEqual(["TV", "MOVIE", "OVA"]);
    expect(
      catalogFiltersReducer(formats, { type: "toggleFormat", format: "MOVIE" }).formats,
    ).toEqual(["TV", "OVA"]);
  });

  it("clearFormats esvazia a seleção", () => {
    const state = { ...initialCatalogFilters, formats: ["TV" as const, "OVA" as const] };

    expect(catalogFiltersReducer(state, { type: "clearFormats" }).formats).toEqual([]);
  });

  it("search normaliza o termo e mantém os formatos; vazio remove o filtro", () => {
    const state = { ...initialCatalogFilters, formats: ["TV" as const] };
    const searched = catalogFiltersReducer(state, { type: "search", term: "  naruto " });

    expect(searched).toMatchObject({ search: "naruto", formats: ["TV"] });
    expect(catalogFiltersReducer(searched, { type: "search", term: "   " }).search).toBeUndefined();
  });

  it("setPerPage troca o tamanho da página; o mesmo tamanho devolve o mesmo estado", () => {
    expect(
      catalogFiltersReducer(initialCatalogFilters, { type: "setPerPage", perPage: 3 }).perPage,
    ).toBe(3);
    // Sem objeto novo: a lista não recarrega e o erro/foco do "Ver mais" continuam valendo
    expect(catalogFiltersReducer(initialCatalogFilters, { type: "setPerPage", perPage: 12 })).toBe(
      initialCatalogFilters,
    );
  });
});
