import { expect, test } from "@playwright/test";

const PRIMARY = "rgb(99, 36, 198)";

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
    await expect(header).toHaveCSS("background-color", PRIMARY);
    expect((await footer.boundingBox())?.height).toBe(54);
    await expect(footer).toHaveCSS("background-color", PRIMARY);
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
