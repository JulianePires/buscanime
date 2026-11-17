import { expect, test } from "@playwright/test";
import figmaCards from "../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { mockAniList } from "./support/anilist";

const PAGE_TITLE = "Buscanime | Busca de animes";
const FIRST_TITLE = figmaCards.cards[0].title;
const FIRST_SYNOPSIS = "Sinopse do anime 1.";

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
    await expect(dialog).toContainText(FIRST_SYNOPSIS);
    await expect(dialog).toContainText("TV Show");
    await expect(page).toHaveTitle(`${FIRST_TITLE} | Buscanime`);
    // Modal de verdade: o foco fica dentro do diálogo
    await expect(dialog.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
    await expect(page).toHaveTitle(PAGE_TITLE);
    // Abrir o detalhe não refaz a listagem; o corpo vem da consulta própria (UC08)
    expect(api.calls).toBe(1);
    expect(api.detailIds).toEqual([1]);
  });

  test('"Fechar" fecha o detalhe; a superfície segue os tokens', async ({ page }) => {
    await mockAniList(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    await page.getByRole("button", { name: FIRST_TITLE }).click();
    const dialog = page.getByRole("dialog", { name: FIRST_TITLE });
    await expect(dialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(dialog).toHaveCSS("border-radius", "8px");
    // UC07: o padding fica no wrapper interno, para o <dialog> só receber cliques do overlay
    await expect(dialog.locator(":scope > div")).toHaveCSS("padding", "24px");
    expect((await dialog.boundingBox())?.width).toBe(720);
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveCSS("color", "rgb(99, 36, 198)");

    await dialog.getByRole("button", { name: "Fechar" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("UC08 - Carregar o detalhe do anime sob demanda", () => {
  test("a listagem não pede a sinopse; o detalhe é consultado uma vez por anime", async ({
    page,
  }) => {
    const api = await mockAniList(page);
    await page.goto("/");
    const card = page.getByRole("button", { name: FIRST_TITLE });
    await expect(card).toBeVisible();

    // Inclui o pedido antecipado do index.html (prefetch.ts), que imprime a mesma ANIME_PAGE
    expect(api.pageQueries.length).toBeGreaterThan(0);
    for (const query of api.pageQueries) {
      expect(query).not.toContain("description");
      expect(query).not.toContain("siteUrl");
    }
    expect(api.detailIds).toEqual([]);

    await card.click();
    const dialog = page.getByRole("dialog", { name: FIRST_TITLE });
    await expect(dialog).toContainText(FIRST_SYNOPSIS);
    await dialog.getByRole("button", { name: "Fechar" }).click();
    await expect(dialog).toBeHidden();

    await card.click();
    await expect(dialog).toContainText(FIRST_SYNOPSIS);
    expect(api.detailIds).toEqual([1]);
  });

  test("abre na hora com o card e mostra o carregamento até a resposta do detalhe", async ({
    page,
  }) => {
    await mockAniList(page);
    let release = () => undefined as void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    // Segura só a consulta do detalhe; a listagem segue pelo mock padrão
    await page.route("https://graphql.anilist.co/**", async (route) => {
      const form = new URLSearchParams(route.request().postData() ?? "");
      if (form.get("operationName") !== "AnimeDetail") return route.fallback();
      await held;
      return route.fallback();
    });
    await page.goto("/");

    await page.getByRole("button", { name: FIRST_TITLE }).click();
    const dialog = page.getByRole("dialog", { name: FIRST_TITLE });
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(FIRST_TITLE);
    await expect(dialog.getByRole("status")).toContainText("Carregando detalhes");
    await expect(dialog).not.toContainText(FIRST_SYNOPSIS);

    release();
    await expect(dialog).toContainText(FIRST_SYNOPSIS);
    await expect(dialog.getByRole("status")).toHaveCount(0);
  });
});
