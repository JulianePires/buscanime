import { describe, expect, it } from "vitest";
import { PAGE_SIZE_MEDIA_QUERIES, pageSizeForWidth } from "./page-size";

describe("pageSizeForWidth", () => {
  it.each([
    [320, 3],
    [600, 3],
    [601, 6],
    [919, 6],
    [920, 9],
    [1219, 9],
    [1220, 12],
    [1920, 12],
  ])("%i px → %i itens por página", (width, perPage) => {
    expect(pageSizeForWidth(width)).toBe(perPage);
  });

  it("tem uma media query por mudança de faixa, nas mesmas larguras", () => {
    expect(PAGE_SIZE_MEDIA_QUERIES).toEqual([
      "(min-width: 601px)",
      "(min-width: 920px)",
      "(min-width: 1220px)",
    ]);
  });
});
