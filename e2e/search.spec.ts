import { expect, test } from "@playwright/test";
import { mockAniList } from "./support/anilist";

const PRIMARY = "rgb(99, 36, 198)";
const WHITE = "rgb(255, 255, 255)";
const GRAY_LIGHT_1 = "rgb(196, 202, 212)";
const SEARCHBOX = { name: "Buscar anime" };

test.describe("UC05 - Filtrar lista por busca de texto", () => {
  test("busca pelo Enter com o termo e os formatos selecionados", async ({ page }) => {
    const api = await mockAniList(page);
    await page.goto("/");
    const cards = page.getByRole("list", { name: "Animes" }).getByRole("article");
    await expect(cards).toHaveCount(12);

    await page
      .getByRole("group", { name: "Formato" })
      .getByRole("button", { name: "Movie" })
      .click();
    await expect.poll(() => api.calls).toBe(2);

    const input = page.getByRole("searchbox", SEARCHBOX);
    await input.fill("one piece");
    // O Enter busca na hora e cancela a busca agendada pela digitação
    await input.press("Enter");

    await expect.poll(() => api.calls).toBe(3);
    expect(api.variables[2]).toMatchObject({
      page: 1,
      search: "one piece",
      formats: ["MOVIE"],
      sort: ["SEARCH_MATCH"],
    });
    await expect(cards).toHaveCount(12);
    await expect(input).toHaveValue("one piece");
  });

  test("busca sozinha depois de uma pausa na digitação, uma vez só", async ({ page }) => {
    const api = await mockAniList(page);
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Animes" }).getByRole("article")).toHaveCount(12);

    // Teclas a cada 50 ms: mais rápido que o debounce, então só o texto final vira requisição
    await page.getByRole("searchbox", SEARCHBOX).pressSequentially("naruto", { delay: 50 });

    await expect.poll(() => api.variables.at(-1)?.search).toBe("naruto");
    // Prefixos como "n" ou "nar" teriam chegado antes do texto final
    expect(api.variables.slice(1)).toEqual([
      expect.objectContaining({ search: "naruto", sort: ["SEARCH_MATCH"] }),
    ]);
  });

  test("segue as medidas e cores do Figma a 1366 px", async ({ page }) => {
    await mockAniList(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    const form = page.getByRole("search");
    const input = form.getByRole("searchbox", SEARCHBOX);
    const button = form.getByRole("button", { name: "Buscar" });

    await expect(input).toHaveCSS("height", "38px");
    await expect(input).toHaveCSS("border", `1px solid ${GRAY_LIGHT_1}`);
    await expect(input).toHaveCSS("border-radius", "4px");
    await expect(input).toHaveCSS("padding-left", "10px");
    await expect(input).toHaveCSS("font-size", "14px");
    await expect(input).toHaveCSS("font-weight", "400");
    await input.focus();
    await expect(input).toHaveCSS("border-color", PRIMARY);

    await expect(button).toHaveCSS("background-color", PRIMARY);
    await expect(button).toHaveCSS("color", WHITE);
    await expect(button).toHaveCSS("font-weight", "600");
    await expect(button).toHaveCSS("font-size", "14px");
    await expect(button).toHaveCSS("border-radius", "4px");

    const formBox = (await form.boundingBox())!;
    const inputBox = (await input.boundingBox())!;
    const buttonBox = (await button.boundingBox())!;
    expect(formBox.width).toBe(1012);
    expect(buttonBox).toMatchObject({ width: 86, height: 38 });
    expect(buttonBox.x - (inputBox.x + inputBox.width)).toBeCloseTo(10, 0);
    // Centralizado na página (clientWidth desconta a barra de rolagem)
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(formBox.x + formBox.width / 2).toBeCloseTo(pageWidth / 2, 0);
  });

  test("cabe em 375 px sem rolagem horizontal", async ({ page }) => {
    await mockAniList(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.getByRole("search").getByRole("button", { name: "Buscar" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
