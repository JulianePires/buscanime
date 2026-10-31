import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Anime } from "../../domain/anime";
import { zom100 } from "../../test/fixtures/anime";
import { AnimeCard } from "./AnimeCard";

function renderCard(anime: Anime = zom100, priority?: boolean, onSelect = vi.fn()) {
  render(<AnimeCard anime={anime} priority={priority} onSelect={onSelect} />);
  return screen.getByRole("article", { name: anime.title });
}

describe("AnimeCard", () => {
  it("abre o detalhe por um botão com o nome do anime, informando qual botão foi acionado", () => {
    const onSelect = vi.fn();
    const card = renderCard(zom100, false, onSelect);

    const button = within(card).getByRole("button", { name: zom100.title });
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(button);
  });

  it("com prioridade, a capa (candidata a LCP) carrega já e com fetchpriority alto", () => {
    const card = renderCard(zom100, true);

    const cover = within(card).getByRole("presentation");
    expect(cover).toHaveAttribute("loading", "eager");
    expect(cover).toHaveAttribute("fetchpriority", "high");
  });

  it("identifica o anime pelo título em um heading", () => {
    const card = renderCard();

    expect(within(card).getByRole("heading", { name: zom100.title })).toBeInTheDocument();
  });

  it("lista os gêneros em chips (até 3)", () => {
    const card = renderCard();

    const genres = within(card).getByRole("list", { name: "Gêneros" });
    expect(
      within(genres)
        .getAllByRole("listitem")
        .map((chip) => chip.textContent),
    ).toEqual(["Action", "Comedy", "Horror"]);
  });

  it("não renderiza a lista de gêneros vazia", () => {
    const card = renderCard({ ...zom100, genres: [] });

    expect(within(card).queryByRole("list")).not.toBeInTheDocument();
  });

  it("mostra a nota 80 em percentual com o tom de alerta (regra vale sobre o Figma)", () => {
    const card = renderCard();

    const badge = within(card).getByText("80%").closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", "warning");
    expect(badge).toHaveClass("bg-warning");
  });

  it("usa a capa decorativa com dimensões fixas e carregamento preguiçoso", () => {
    const card = renderCard();

    // alt="" tira a imagem da árvore de acessibilidade (role presentation)
    const cover = within(card).getByRole("presentation");
    expect(cover).toHaveAttribute("src", zom100.coverUrl);
    expect(cover).toHaveAttribute("alt", "");
    expect(cover).toHaveAttribute("width", "317");
    expect(cover).toHaveAttribute("height", "270");
    expect(cover).toHaveAttribute("loading", "lazy");
    expect(cover).toHaveAttribute("decoding", "async");
  });

  it("sem capa e sem nota mantém título e cor de fundo da capa", () => {
    const card = renderCard({ ...zom100, coverUrl: null, averageScore: null });

    expect(within(card).queryByRole("presentation")).not.toBeInTheDocument();
    expect(within(card).queryByText(/%$/)).not.toBeInTheDocument();
    expect(card).toHaveStyle({ backgroundColor: "#e4a15d" });
  });
});
