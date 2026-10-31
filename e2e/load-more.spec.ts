import { expect, test } from "@playwright/test";
import figmaCards from "../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { mockAniList } from "./support/anilist";

const WARNING = "rgb(255, 184, 0)";
const WHITE = "rgb(255, 255, 255)";
const LOAD_MORE = { name: "Ver mais" };

test.describe("UC06 - Carregar mais animes pelo Ver mais", () => {
  test("carrega a próxima página sem recarregar a tela e mantém os cards exibidos", async ({
    page,
  }) => {
    const api = await mockAniList(page, { pages: 2 });
    await page.goto("/");
    const cards = page.getByRole("list", { name: "Animes" }).getByRole("article");
    await expect(cards).toHaveCount(12);
    const url = page.url();
    // Marca no documento: um recarregamento a apagaria
    await page.evaluate(() => {
      (window as unknown as { loadMoreMark: boolean }).loadMoreMark = true;
    });

    await page.getByRole("button", LOAD_MORE).click();

    await expect(cards).toHaveCount(24);
    await expect(cards.first()).toContainText(figmaCards.cards[0].title);
    await expect(page.getByRole("button", { name: "Anime 13" })).toBeFocused();
    expect(page.url()).toBe(url);
    expect(
      await page.evaluate(() => (window as unknown as { loadMoreMark?: boolean }).loadMoreMark),
    ).toBe(true);
    expect(api.variables.map((variables) => variables.page)).toEqual([1, 2]);
    // Última página: o botão some
    await expect(page.getByRole("button", LOAD_MORE)).toHaveCount(0);
  });

  test("segue as medidas e cores do Figma a 1366 px", async ({ page }) => {
    await mockAniList(page, { pages: 2 });
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    const button = page.getByRole("button", LOAD_MORE);
    const icon = button.locator("img");

    await expect(button).toHaveCSS("background-color", WARNING);
    await expect(button).toHaveCSS("color", WHITE);
    await expect(button).toHaveCSS("border-radius", "8px");
    await expect(button).toHaveCSS("font-size", "20px");
    await expect(button).toHaveCSS("font-weight", "600");
    expect(await button.boundingBox()).toMatchObject({ width: 1316, height: 48 });
    expect(await icon.boundingBox()).toMatchObject({ width: 30, height: 24 });
  });
});

test.describe("Tamanho da página por largura de tela", () => {
  test("pede 3 a 375 px e passa a 12 ao alargar a janela além de 1220 px", async ({ page }) => {
    const api = await mockAniList(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect.poll(() => api.variables[0]).toMatchObject({ page: 1, perPage: 3 });

    await page.setViewportSize({ width: 1366, height: 900 });

    await expect.poll(() => api.variables.at(-1)).toMatchObject({ page: 1, perPage: 12 });
    expect(api.variables.map((variables) => variables.perPage)).toEqual([3, 12]);
  });
});
