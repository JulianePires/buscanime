import { expect, test } from "@playwright/test";
import { mockAniList } from "./support/anilist";

const PRIMARY = "rgb(99, 36, 198)";
const WHITE = "rgb(255, 255, 255)";
const ALL_FORMATS = "All Formats";

/** Roda no navegador (evaluateAll): caixas dos elementos em coordenadas da página. */
function toRects(elements: Element[]) {
  return elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect);
}

test.describe("UC04 - Filtrar lista por um ou mais formatos", () => {
  test("envia os formatos selecionados no format_in e limpa com All Formats", async ({ page }) => {
    const api = await mockAniList(page);
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Animes" }).getByRole("article")).toHaveCount(12);

    const group = page.getByRole("group", { name: "Formato" });
    const format = (name: string) => group.getByRole("button", { name });
    const pressed = group.getByRole("button", { pressed: true });
    await format("TV Show").click();
    await expect.poll(() => api.calls).toBe(2);
    await format("Movie").click();
    await expect.poll(() => api.calls).toBe(3);

    expect(api.variables[0]).not.toHaveProperty("formats");
    expect(api.variables[2]).toMatchObject({ page: 1, formats: ["TV", "MOVIE"] });
    await expect(pressed).toHaveText(["TV Show", "Movie"]);

    await format(ALL_FORMATS).click();
    await expect(pressed).toHaveText([ALL_FORMATS]);
    // Sem formatos já está no cache
    expect(api.calls).toBe(3);
  });

  test("segue as medidas e cores do Figma a 1366 px", async ({ page }) => {
    await mockAniList(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");

    const group = page.getByRole("group", { name: "Formato" });
    const active = group.getByRole("button", { name: ALL_FORMATS });
    const inactive = group.getByRole("button", { name: "Movie" });

    await expect(active).toHaveCSS("background-color", PRIMARY);
    await expect(active).toHaveCSS("color", WHITE);
    await expect(inactive).toHaveCSS("background-color", WHITE);
    await expect(inactive).toHaveCSS("color", PRIMARY);
    await expect(inactive).toHaveCSS("border", `1px solid ${PRIMARY}`);
    await expect(inactive).toHaveCSS("border-radius", "4px");
    await expect(inactive).toHaveCSS("font-weight", "600");
    await expect(inactive).toHaveCSS("font-size", "14px");

    const boxes = await group.getByRole("button").evaluateAll(toRects);
    // Uma linha só, 32 px de altura e 19 px entre os botões
    expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
    for (const box of boxes) expect(box.height).toBe(32);
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index].left - boxes[index - 1].right).toBeCloseTo(19, 0);
    }
    // Linha centralizada na página (clientWidth desconta a barra de rolagem)
    const center = (boxes[0].left + boxes.at(-1)!.right) / 2;
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(center).toBeCloseTo(pageWidth / 2, 0);
  });

  test("quebra a linha em 375 px sem rolagem horizontal", async ({ page }) => {
    await mockAniList(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.getByRole("group", { name: "Formato" }).getByRole("button")).toHaveCount(8);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
