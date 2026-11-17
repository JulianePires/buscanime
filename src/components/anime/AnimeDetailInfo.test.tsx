import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnimeDetail } from "../../domain/anime";
import { zom100 } from "../../test/fixtures/anime";
import { AnimeDetailInfo } from "./AnimeDetailInfo";

function renderInfo(detail: AnimeDetail = zom100) {
  const { container } = render(<AnimeDetailInfo detail={detail} />);
  return container;
}

/** Valor (dd) de um termo (dt) da lista de dados. */
function fact(term: string) {
  return screen.getByText(term, { selector: "dt" }).nextElementSibling;
}

describe("AnimeDetailInfo (corpo do modal, UC08)", () => {
  it("mostra formato legível, episódios, ano e situação", () => {
    renderInfo({ ...zom100, format: "TV_SHORT" });

    expect(fact("Formato")).toHaveTextContent("TV Short");
    expect(fact("Episódios")).toHaveTextContent("12");
    expect(fact("Ano")).toHaveTextContent("2023");
    expect(fact("Situação")).toHaveTextContent("Finalizado");
  });

  it("mostra a sinopse como texto, preservando os parágrafos", () => {
    renderInfo();

    const synopsis = screen.getByText(/^Akira passou anos/);
    expect(synopsis.textContent).toBe(zom100.description);
    expect(synopsis).toHaveClass("whitespace-pre-line");
    expect(screen.getByRole("region", { name: "Sinopse" })).toContainElement(synopsis);
  });

  it("leva à página do anime no AniList em nova aba", () => {
    renderInfo();

    const link = screen.getByRole("link", { name: /Ver no AniList/ });
    expect(link).toHaveAttribute("href", zom100.siteUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(within(link).getByText("(abre em nova aba)")).toHaveClass("sr-only");
  });

  it("omite o que o AniList não informou", () => {
    const container = renderInfo({
      ...zom100,
      format: null,
      episodes: null,
      seasonYear: null,
      status: null,
      description: null,
      siteUrl: null,
    });

    expect(container.querySelector("dl")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sinopse" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
