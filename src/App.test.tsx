import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("UC01 - Visualizar estrutura da página", () => {
  it("exibe a marca na navegação principal com link para a página inicial", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    const brand = within(navigation).getByRole("link", { name: /buscanime/i });

    expect(brand).toBeVisible();
    expect(brand).toHaveAttribute("href", "/");
  });

  it("organiza o conteúdo em cabeçalho e área principal", () => {
    render(<App />);

    expect(screen.getByRole("banner")).toContainElement(screen.getByRole("navigation"));
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
