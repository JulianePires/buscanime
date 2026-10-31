import { expect, test } from "@playwright/test";
import figmaCards from "../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { mockAniList } from "./support/anilist";

const BACKGROUND = "background-color";
const PRIMARY = "rgb(99, 36, 198)";
const WARNING = "rgb(255, 184, 0)";

// Nenhum teste chama a API real
test.beforeEach(async ({ page }) => {
  await mockAniList(page);
});

test.describe("UC01 - Visualizar estrutura da página", () => {
  test("exibe a estrutura base com a marca na navegação", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Buscanime/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

    const navigation = page.getByRole("navigation", { name: /principal/i });
    await expect(navigation.getByRole("link", { name: "Buscanime" })).toBeVisible();
    await expect(page.getByRole("main")).toBeAttached();
    await expect(page.getByRole("contentinfo")).toContainText("TODOS OS DIREITOS RESERVADOS");
  });

  test("segue as medidas do Figma no cabeçalho e no rodapé", async ({ page }) => {
    await page.goto("/");

    const header = page.getByRole("banner");
    const footer = page.getByRole("contentinfo");

    expect((await header.boundingBox())?.height).toBe(68);
    await expect(header).toHaveCSS(BACKGROUND, PRIMARY);
    expect((await footer.boundingBox())?.height).toBe(54);
    await expect(footer).toHaveCSS(BACKGROUND, PRIMARY);
  });

  test("não rola na horizontal em 375 px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});

test.describe("UC02 - Visualizar listagem de animes", () => {
  test("exibe os 12 cards em grade de 4 colunas a 1366 px", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    const grid = page.getByRole("list", { name: "Animes" });
    const cards = grid.getByRole("article");
    await expect(cards).toHaveCount(12);
    for (const card of await cards.all()) await expect(card).toBeVisible();

    const columns = await grid.evaluate((list) =>
      getComputedStyle(list).gridTemplateColumns.split(" "),
    );
    expect(columns).toEqual(["317px", "317px", "317px", "317px"]);

    const first = await cards.first().boundingBox();
    expect(first?.width).toBe(317);
    expect(first?.height).toBeCloseTo(270, 0);
  });

  test("pinta a nota 80 de amarelo, pela regra de negócio", async ({ page }) => {
    await page.goto("/");

    const zom100 = page.getByRole("article", { name: figmaCards.cards[0].title });
    const score = zom100.locator("[data-tone]");
    await expect(score).toHaveCSS(BACKGROUND, WARNING);
    await expect(score).toContainText("80%");
  });
});
