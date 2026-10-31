import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import figmaCards from "../../../docs/design-context/fixtures/figma-cards.json";
import type { Anime } from "../../domain/anime";
import { zom100 } from "../../test/fixtures/anime";
import { AnimeGrid } from "./AnimeGrid";

const animes: Anime[] = figmaCards.cards.map((card, index) => ({
  ...zom100,
  id: index + 1,
  title: card.title,
  englishTitle: null,
  coverUrl: `https://img.anili.st/media/${index + 1}.jpg`,
  coverColor: null,
  genres: card.genres,
  averageScore: card.averageScore,
}));

describe("AnimeGrid", () => {
  it("renderiza os 12 cards do Figma como itens de lista, na ordem recebida", () => {
    render(<AnimeGrid animes={animes} />);

    const grid = screen.getByRole("list", { name: "Animes" });
    const cards = within(grid).getAllByRole("article");
    expect(cards).toHaveLength(12);
    expect(within(cards[0]).getByRole("heading")).toHaveTextContent(figmaCards.cards[0].title);
  });

  it("foca o card em focusIndex quando ele entra na lista (primeiro card novo do Ver mais)", () => {
    const firstPage = animes.slice(0, 6);
    const { rerender } = render(<AnimeGrid animes={firstPage} focusIndex={6} />);
    expect(document.body).toHaveFocus();

    rerender(<AnimeGrid animes={animes} focusIndex={6} />);

    expect(screen.getByRole("button", { name: animes[6].title })).toHaveFocus();
  });

  it.each(figmaCards.cards)("$title: nota $averageScore% → $expectedColor", (card) => {
    render(<AnimeGrid animes={animes} />);

    const article = screen.getByRole("article", { name: card.title });
    const badge = within(article).getByText(`${card.averageScore}%`).closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", card.expectedColor);
  });
});
