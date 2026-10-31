import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

const LOGO_SRC = "/brand/logo.svg";

describe("UC01 - Visualizar estrutura da página", () => {
  it("exibe o logo na navegação principal com link para a página inicial", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    const brand = within(navigation).getByRole("link", { name: "Buscanime" });

    expect(brand).toBeVisible();
    expect(brand).toHaveAttribute("href", "/");
    expect(brand.querySelector("img")).toHaveAttribute("src", LOGO_SRC);
  });

  it("exibe o título principal na área de conteúdo", () => {
    render(<App />);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("exibe o logo e a legenda no rodapé", () => {
    render(<App />);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("TODOS OS DIREITOS RESERVADOS")).toBeInTheDocument();
    expect(footer.querySelector("img")).toHaveAttribute("src", LOGO_SRC);
  });

  it("organiza a página na ordem cabeçalho, conteúdo e rodapé", () => {
    render(<App />);

    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");

    expect(header).toContainElement(screen.getByRole("navigation"));
    expect(header.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(main.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
