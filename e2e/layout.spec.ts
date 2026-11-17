import { expect, type Page, test } from "@playwright/test";
import figmaCards from "../docs/design-context/fixtures/figma-cards.json" with { type: "json" };
import { mockAniList } from "./support/anilist";

const FIRST_TITLE = figmaCards.cards[0].title;
const DESKTOP = { width: 1366, height: 900 };

function scrollY(page: Page) {
  return page.evaluate(() => window.scrollY);
}

function clientWidth(page: Page) {
  return page.evaluate(() => document.documentElement.clientWidth);
}

/** Abre a página com os 12 cards do Figma já renderizados. */
async function gotoList(page: Page, viewport = DESKTOP) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.getByRole("list", { name: "Animes" }).getByRole("article")).toHaveCount(12);
}

async function openDetail(page: Page) {
  const card = page.getByRole("button", { name: FIRST_TITLE });
  await card.click();
  const dialog = page.getByRole("dialog", { name: FIRST_TITLE });
  await expect(dialog).toBeVisible();
  return { card, dialog };
}

test.beforeEach(async ({ page }) => {
  await mockAniList(page);
});

test.describe("UC07 - Usar a página com layout estável", () => {
  test("rodapé: com conteúdo menor que a janela, encosta no final dela", async ({ page }) => {
    await gotoList(page, { width: 1366, height: 2400 });

    const footer = await page.getByRole("contentinfo").boundingBox();
    expect(footer && footer.y + footer.height).toBe(2400);
    expect(footer?.height).toBe(54);
  });

  test("rodapé: com conteúdo maior que a janela, vem depois do conteúdo", async ({ page }) => {
    await gotoList(page);

    const footer = page.getByRole("contentinfo");
    const mainBox = await page.getByRole("main").boundingBox();
    const footerBox = await footer.boundingBox();
    expect(footerBox?.y).toBeGreaterThanOrEqual((mainBox?.y ?? 0) + (mainBox?.height ?? 0));
    await expect(footer).not.toBeInViewport();
    await expect(footer).toHaveCSS("position", "static");
  });

  test("overlay: clicar fora do conteúdo fecha o modal e devolve o foco ao card", async ({
    page,
  }) => {
    await gotoList(page);
    const { card, dialog } = await openDetail(page);

    await page.mouse.click(10, 10);

    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();
  });

  test("overlay: clicar dentro do conteúdo não fecha o modal", async ({ page }) => {
    await gotoList(page);
    const { dialog } = await openDetail(page);

    await dialog.getByRole("heading", { level: 2 }).click();
    // Canto da superfície, dentro do padding: continua sendo conteúdo
    const box = await dialog.boundingBox();
    await page.mouse.click((box?.x ?? 0) + 4, (box?.y ?? 0) + 4);

    await expect(dialog).toBeVisible();
  });

  test("scroll: a página de fundo trava com o modal e volta da mesma posição", async ({ page }) => {
    await gotoList(page);
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" }));
    const widthBefore = await clientWidth(page);

    const { dialog } = await openDetail(page);
    const opened = await scrollY(page);
    await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
    // Sem salto de largura quando a barra de rolagem some (scrollbar-gutter: stable só com o modal)
    await expect(page.locator("html")).toHaveCSS("scrollbar-gutter", "stable");
    expect(await clientWidth(page)).toBe(widthBefore);

    await page.mouse.move(10, 10);
    await page.mouse.wheel(0, 600);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(await scrollY(page)).toBe(opened);
    await expect(page.locator("html")).toHaveCSS("overflow-y", "visible");

    await page.mouse.wheel(0, 300);
    await expect.poll(() => scrollY(page)).toBeGreaterThan(opened);
  });
});
