import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Anime } from "../../domain/anime";
import { zom100 } from "../../test/fixtures/anime";
import { AnimeDetailDialog } from "./AnimeDetailDialog";

function renderDialog(anime: Anime = zom100) {
  const onClose = vi.fn();
  render(<AnimeDetailDialog anime={anime} onClose={onClose} />);
  return { dialog: screen.getByRole("dialog", { name: anime.title }), onClose };
}

/** Valor (dd) de um termo (dt) da lista de dados. */
function detail(dialog: HTMLElement, term: string) {
  return within(dialog).getByText(term, { selector: "dt" }).nextElementSibling;
}

describe("AnimeDetailDialog", () => {
  it("abre como modal com o título como nome acessível", () => {
    const { dialog } = renderDialog();

    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent(zom100.title);
  });

  it("mostra o título em inglês, a capa decorativa e os gêneros", () => {
    const { dialog } = renderDialog();

    expect(within(dialog).getByText("Zom 100: Bucket List of the Dead")).toBeInTheDocument();
    const cover = within(dialog).getByRole("presentation");
    expect(cover).toHaveAttribute("src", zom100.coverUrl);
    expect(cover).toHaveAttribute("alt", "");
    const genres = within(dialog).getByRole("list", { name: "Gêneros" });
    expect(
      within(genres)
        .getAllByRole("listitem")
        .map((chip) => chip.textContent),
    ).toEqual(zom100.genres);
  });

  it("mostra a nota com o tom da regra de negócio", () => {
    const { dialog } = renderDialog();

    const badge = within(dialog).getByText("80%").closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", "warning");
  });

  it("mostra formato legível, episódios, ano e situação", () => {
    const { dialog } = renderDialog({ ...zom100, format: "TV_SHORT" });

    expect(detail(dialog, "Formato")).toHaveTextContent("TV Short");
    expect(detail(dialog, "Episódios")).toHaveTextContent("12");
    expect(detail(dialog, "Ano")).toHaveTextContent("2023");
    expect(detail(dialog, "Situação")).toHaveTextContent("Finalizado");
  });

  it("mostra a sinopse como texto, preservando os parágrafos", () => {
    const { dialog } = renderDialog();

    const synopsis = within(dialog).getByText(/^Akira passou anos/);
    expect(synopsis.textContent).toBe(zom100.description);
    expect(synopsis).toHaveClass("whitespace-pre-line");
  });

  it("leva à página do anime no AniList em nova aba", () => {
    const { dialog } = renderDialog();

    const link = within(dialog).getByRole("link", { name: /Ver no AniList/ });
    expect(link).toHaveAttribute("href", zom100.siteUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("omite o que o AniList não informou", () => {
    const { dialog } = renderDialog({
      ...zom100,
      englishTitle: null,
      coverUrl: null,
      genres: [],
      averageScore: null,
      format: null,
      episodes: null,
      seasonYear: null,
      status: null,
      description: null,
      siteUrl: null,
    });

    expect(within(dialog).queryByRole("presentation")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("list")).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/%$/)).not.toBeInTheDocument();
    expect(dialog.querySelector("dl")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "Sinopse" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
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
