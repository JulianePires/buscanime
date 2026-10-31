import { expect, test } from "@playwright/test";
import figmaCards from "../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { mockAniList } from "./support/anilist";

const PAGE_TITLE = "Buscanime | Busca de animes";
const FIRST_TITLE = figmaCards.cards[0].title;

test.describe("UC03 - Visualizar detalhe do anime listado", () => {
  test("abre e fecha o detalhe só pelo teclado, sem nova requisição", async ({ page }) => {
    const api = await mockAniList(page);
    await page.goto("/");
    const card = page.getByRole("button", { name: FIRST_TITLE });
    await expect(card).toBeVisible();

    // Logo da navegação → 8 filtros de formato (UC04) → campo e "Buscar" (UC05) → primeiro card
    for (let stop = 0; stop < 12; stop += 1) await page.keyboard.press("Tab");
    await expect(card).toBeFocused();

    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: FIRST_TITLE });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Sinopse do anime 1.");
    await expect(dialog).toContainText("TV Show");
    await expect(page).toHaveTitle(`${FIRST_TITLE} | Buscanime`);
    // Modal de verdade: o foco fica dentro do diálogo
    await expect(dialog.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
    await expect(page).toHaveTitle(PAGE_TITLE);
    expect(api.calls).toBe(1);
  });

  test('"Fechar" fecha o detalhe; a superfície segue os tokens', async ({ page }) => {
    await mockAniList(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    await page.getByRole("button", { name: FIRST_TITLE }).click();
    const dialog = page.getByRole("dialog", { name: FIRST_TITLE });
    await expect(dialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(dialog).toHaveCSS("border-radius", "8px");
    await expect(dialog).toHaveCSS("padding", "24px");
    expect((await dialog.boundingBox())?.width).toBe(720);
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveCSS("color", "rgb(99, 36, 198)");

    await dialog.getByRole("button", { name: "Fechar" }).click();
    await expect(dialog).toBeHidden();
  });
});
