import { expect, test } from "@playwright/test";
import { mockAniList } from "./support/anilist";

const SEARCHBOX = { name: "Buscar anime" };

test.describe("UC09 - Compartilhar e restaurar os filtros pela URL", () => {
  test("a busca e os formatos aplicados vão para os query params", async ({ page }) => {
    await mockAniList(page);
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Animes" }).getByRole("article")).toHaveCount(12);

    await page.getByRole("group", { name: "Formato" }).getByRole("button", { name: "OVA" }).click();
    await page.getByRole("searchbox", SEARCHBOX).fill("one piece");
    await page.getByRole("searchbox", SEARCHBOX).press("Enter");

    await expect(page).toHaveURL(/\/\?q=one\+piece&format=OVA$/);
  });

  test("o link abre com os filtros preenchidos e uma requisição só, sem o prefetch", async ({
    page,
  }) => {
    const api = await mockAniList(page);
    await page.goto("/?q=naruto&format=TV&format=MOVIE");

    await expect(page.getByRole("list", { name: "Animes" }).getByRole("article")).toHaveCount(12);
    await expect(page.getByRole("searchbox", SEARCHBOX)).toHaveValue("naruto");
    await expect(
      page.getByRole("group", { name: "Formato" }).getByRole("button", { pressed: true }),
    ).toHaveText(["TV Show", "Movie"]);
    // O script inline não antecipa a lista sem filtros, que seria descartada
    expect(api.variables).toEqual([
      expect.objectContaining({ search: "naruto", formats: ["TV", "MOVIE"] }),
    ]);
  });

  test("voltar e avançar do navegador restauram os filtros e o campo", async ({ page }) => {
    const api = await mockAniList(page);
    await page.goto("/");
    const input = page.getByRole("searchbox", SEARCHBOX);
    const movie = page
      .getByRole("group", { name: "Formato" })
      .getByRole("button", { name: "Movie" });
    await expect(page.getByRole("list", { name: "Animes" }).getByRole("article")).toHaveCount(12);

    await input.fill("bleach");
    await input.press("Enter");
    await expect(page).toHaveURL(/\?q=bleach$/);
    await movie.click();
    await expect(page).toHaveURL(/\?q=bleach&format=MOVIE$/);

    await page.goBack();
    await expect(page).toHaveURL(/\?q=bleach$/);
    await expect(movie).toHaveAttribute("aria-pressed", "false");
    await expect(input).toHaveValue("bleach");

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(input).toHaveValue("");

    await page.goForward();
    await expect(input).toHaveValue("bleach");
    // Todas as combinações já estavam no cache do Apollo
    expect(api.calls).toBe(3);
  });
});
