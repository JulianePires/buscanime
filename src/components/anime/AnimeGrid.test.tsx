import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import figmaCards from "../../../docs/design-context/fixtures/figma-cards.json";
import type { Anime } from "../../domain/anime";
import { zom100Card } from "../../test/fixtures/anime";
import { type AnimeDetailSlotProps, AnimeGrid } from "./AnimeGrid";

const animes: Anime[] = figmaCards.cards.map((card, index) => ({
  ...zom100Card,
  id: index + 1,
  title: card.title,
  englishTitle: null,
  coverUrl: `https://img.anili.st/media/${index + 1}.jpg`,
  coverColor: null,
  genres: card.genres,
  averageScore: card.averageScore,
}));

const NoDetail = () => null;

describe("AnimeGrid", () => {
  it("renderiza os 12 cards do Figma como itens de lista, na ordem recebida", () => {
    render(<AnimeGrid animes={animes} detail={NoDetail} />);

    const grid = screen.getByRole("list", { name: "Animes" });
    const cards = within(grid).getAllByRole("article");
    expect(cards).toHaveLength(12);
    expect(within(cards[0]).getByRole("heading")).toHaveTextContent(figmaCards.cards[0].title);
  });

  it("foca o card em focusIndex quando ele entra na lista (primeiro card novo do Ver mais)", () => {
    const firstPage = animes.slice(0, 6);
    const { rerender } = render(<AnimeGrid animes={firstPage} focusIndex={6} detail={NoDetail} />);
    expect(document.body).toHaveFocus();

    rerender(<AnimeGrid animes={animes} focusIndex={6} detail={NoDetail} />);

    expect(screen.getByRole("button", { name: animes[6].title })).toHaveFocus();
  });

  it.each(figmaCards.cards)("$title: nota $averageScore% → $expectedColor", (card) => {
    render(<AnimeGrid animes={animes} detail={NoDetail} />);

    const article = screen.getByRole("article", { name: card.title });
    const badge = within(article).getByText(`${card.averageScore}%`).closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", card.expectedColor);
  });
});

describe("AnimeGrid - detalhe injetado (UC08)", () => {
  it("renderiza o detalhe recebido com o anime selecionado; onClose devolve o foco ao card", () => {
    const FakeDetail = ({ anime, onClose }: AnimeDetailSlotProps) => (
      <button type="button" onClick={onClose}>
        Fechar {anime.title}
      </button>
    );
    render(<AnimeGrid animes={animes} detail={FakeDetail} />);
    const card = screen.getByRole("button", { name: animes[2].title });
    expect(screen.queryByRole("button", { name: /^Fechar/ })).not.toBeInTheDocument();

    fireEvent.click(card);
    fireEvent.click(screen.getByRole("button", { name: `Fechar ${animes[2].title}` }));
    expect(screen.queryByRole("button", { name: /^Fechar/ })).not.toBeInTheDocument();
    expect(card).toHaveFocus();
  });
});
