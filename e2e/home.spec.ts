import { expect, test } from "@playwright/test";

test.describe("UC01 - Visualizar estrutura da página", () => {
  test("exibe a estrutura base com a marca na navegação", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Buscanime/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

    const navigation = page.getByRole("navigation", { name: /principal/i });
    await expect(navigation.getByRole("link", { name: /buscanime/i })).toBeVisible();
    await expect(page.getByRole("main")).toBeAttached();
  });
});
