import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Anime } from "../../domain/anime";
import { zom100Card } from "../../test/fixtures/anime";
import { AnimeDetailDialog } from "./AnimeDetailDialog";

const BODY = "Corpo vindo da consulta do detalhe";

function renderDialog(anime: Anime = zom100Card) {
  const onClose = vi.fn();
  render(
    <AnimeDetailDialog anime={anime} onClose={onClose}>
      <p>{BODY}</p>
    </AnimeDetailDialog>,
  );
  return { dialog: screen.getByRole("dialog", { name: anime.title }), onClose };
}

describe("AnimeDetailDialog", () => {
  it("abre como modal com o título como nome acessível", () => {
    const { dialog } = renderDialog();

    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent(zom100Card.title);
  });

  it("mostra o título em inglês, a capa decorativa e os gêneros só com o resumo do card", () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByText("Zom 100: Bucket List of the Dead")).toBeInTheDocument();
    const cover = within(dialog).getByRole("presentation");
    expect(cover).toHaveAttribute("src", zom100Card.coverUrl);
    expect(cover).toHaveAttribute("alt", "");
    const genres = within(dialog).getByRole("list", { name: "Gêneros" });
    expect(
      within(genres)
        .getAllByRole("listitem")
        .map((chip) => chip.textContent),
    ).toEqual(zom100Card.genres);
  });

  it("mostra a nota com o tom da regra de negócio", () => {
    const { dialog } = renderDialog();

    const badge = within(dialog).getByText("80%").closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", "warning");
  });

  it("renderiza o corpo recebido (UC08: o que depende da consulta do detalhe)", () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByText(BODY)).toBeInTheDocument();
  });

  it("omite o que o AniList não informou", () => {
    const { dialog } = renderDialog({
      ...zom100Card,
      englishTitle: null,
      coverUrl: null,
      genres: [],
      averageScore: null,
    });

    expect(within(dialog).queryByText(zom100Card.englishTitle ?? "")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("presentation")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("list")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/%$/)).not.toBeInTheDocument();
  });

  it('"Fechar" fecha o diálogo e avisa quem o abriu', () => {
    const { dialog, onClose } = renderDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }));

    expect(dialog).not.toHaveAttribute("open");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Esc fecha o diálogo e avisa quem o abriu", () => {
    const { dialog, onClose } = renderDialog();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(dialog).not.toHaveAttribute("open");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
describe("AnimeDetailDialog - UC07 clique no overlay", () => {
  it("clique no overlay (o próprio <dialog>) fecha e avisa quem o abriu", () => {
    const { dialog, onClose } = renderDialog();

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);

    expect(dialog).not.toHaveAttribute("open");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clique dentro do conteúdo não fecha", () => {
    const { dialog, onClose } = renderDialog();
    const title = within(dialog).getByRole("heading", { level: 2 });

    fireEvent.pointerDown(title);
    fireEvent.click(title);

    expect(dialog).toHaveAttribute("open");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("arrastar do conteúdo até o overlay (seleção de texto) não fecha", () => {
    const { dialog, onClose } = renderDialog();

    fireEvent.pointerDown(within(dialog).getByText(BODY));
    fireEvent.click(dialog);

    expect(dialog).toHaveAttribute("open");
    expect(onClose).not.toHaveBeenCalled();
  });
});
