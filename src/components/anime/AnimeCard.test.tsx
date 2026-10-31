import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Anime } from "../../domain/anime";
import { AnimeCard } from "./AnimeCard";

const zom100: Anime = {
  id: 159831,
  title: "Zom 100: Zombie ni Naru Made ni Shitai 100 no Koto",
  coverUrl: "https://img.anili.st/media/159831.jpg",
  coverColor: "#e4a15d",
  genres: ["Action", "Comedy", "Horror"],
  averageScore: 80,
  format: "TV",
};

function renderCard(anime: Anime = zom100, priority?: boolean) {
  render(<AnimeCard anime={anime} priority={priority} />);
  return screen.getByRole("article", { name: anime.title });
}

describe("AnimeCard", () => {
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
