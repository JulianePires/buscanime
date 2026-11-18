import { describe, expect, it } from "vitest";
import { catalogSearchParams, filtersFromSearchParams } from "./catalog-url";

describe("filtersFromSearchParams (link aberto, voltar e avançar)", () => {
  it("sem query params, não há filtros", () => {
    expect(filtersFromSearchParams("")).toEqual({ formats: [], search: undefined });
  });

  it("lê o termo de q e os formatos de format repetido, na ordem do link", () => {
    expect(filtersFromSearchParams("?q=one+piece&format=MOVIE&format=TV")).toEqual({
      formats: ["MOVIE", "TV"],
      search: "one piece",
    });
  });

  it("normaliza o termo como a busca: espaços nas pontas saem e vazio remove o filtro", () => {
    expect(filtersFromSearchParams("?q=%20%20naruto%20").search).toBe("naruto");
    expect(filtersFromSearchParams("?q=%20%20").search).toBeUndefined();
  });

  it("aceita formato em minúsculas e ignora formatos desconhecidos ou repetidos", () => {
    expect(filtersFromSearchParams("?format=tv&format=MANGA&format=TV&format=ova").formats).toEqual(
      ["TV", "OVA"],
    );
  });
});

describe("catalogSearchParams (URL da combinação exibida)", () => {
  it("sem filtros, a URL fica sem query string", () => {
    expect(catalogSearchParams("", { formats: [], search: undefined })).toBe("");
  });

  it("escreve q e um format por formato selecionado", () => {
    expect(catalogSearchParams("", { formats: ["TV", "MOVIE"], search: "one piece" })).toBe(
      "?q=one+piece&format=TV&format=MOVIE",
    );
  });

  it("troca só os próprios parâmetros e mantém os demais (ex.: utm)", () => {
    expect(
      catalogSearchParams("?utm_source=news&q=bleach&format=OVA", { formats: [], search: "x" }),
    ).toBe("?utm_source=news&q=x");
  });

  it("ida e volta: a URL gerada devolve os mesmos filtros", () => {
    const filters = { formats: ["SPECIAL" as const], search: "film: red & co" };

    expect(filtersFromSearchParams(catalogSearchParams("", filters))).toEqual(filters);
  });
});
