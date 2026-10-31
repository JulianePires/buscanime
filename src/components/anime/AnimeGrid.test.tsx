import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import figmaCards from "../../../docs/design-context/fixtures/figma-cards.json";
import type { Anime } from "../../domain/anime";
import { AnimeGrid } from "./AnimeGrid";

const animes: Anime[] = figmaCards.cards.map((card, index) => ({
  id: index + 1,
  title: card.title,
  coverUrl: `https://img.anili.st/media/${index + 1}.jpg`,
  coverColor: null,
  genres: card.genres,
  averageScore: card.averageScore,
  format: "TV",
}));

describe("AnimeGrid", () => {
  it("renderiza os 12 cards do Figma como itens de lista, na ordem recebida", () => {
    render(<AnimeGrid animes={animes} />);

    const grid = screen.getByRole("list", { name: "Animes" });
    const cards = within(grid).getAllByRole("article");
    expect(cards).toHaveLength(12);
    expect(within(cards[0]).getByRole("heading")).toHaveTextContent(figmaCards.cards[0].title);
  });

  it.each(figmaCards.cards)("$title: nota $averageScore% → $expectedColor", (card) => {
    render(<AnimeGrid animes={animes} />);

    const article = screen.getByRole("article", { name: card.title });
    const badge = within(article).getByText(`${card.averageScore}%`).closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", card.expectedColor);
  });
});

describe("AnimeGrid - prioridade das capas", () => {
  it("prioriza só a primeira capa; as demais são lazy para não disputar banda com o LCP", () => {
    render(<AnimeGrid animes={animes} />);

    const covers = screen.getAllByRole("presentation");
    expect(covers.map((cover) => cover.getAttribute("loading"))).toEqual([
      "eager",
      ...Array(11).fill("lazy"),
    ]);
    expect(covers[0]).toHaveAttribute("fetchpriority", "high");
  });
});
