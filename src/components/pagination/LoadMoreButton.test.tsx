import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadMoreButton } from "./LoadMoreButton";

function renderButton(props: Partial<Parameters<typeof LoadMoreButton>[0]> = {}) {
  const onLoadMore = vi.fn<() => void>();
  render(<LoadMoreButton hasNextPage onLoadMore={onLoadMore} {...props} />);
  return { onLoadMore };
}

describe("LoadMoreButton (specs/ver-mais.md)", () => {
  it('é um botão "Ver mais" com o ícone do Figma decorativo, sem redimensionar', () => {
    renderButton();

    const button = screen.getByRole("button", { name: "Ver mais" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
    const icon = button.querySelector("img");
    expect(icon).toHaveAttribute("src", "/icons/add.svg");
    expect(icon).toHaveAttribute("alt", "");
    expect(icon).toHaveAttribute("width", "30");
    expect(icon).toHaveAttribute("height", "24");
  });

  it("chama onLoadMore ao ser acionado", () => {
    const { onLoadMore } = renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Ver mais" }));

    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('fica com aria-busy, desabilitado e com o texto "Carregando..." durante o carregamento', () => {
    renderButton({ loading: true });

    const button = screen.getByRole("button", { name: "Carregando..." });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });

  it("não é exibido sem hasNextPage", () => {
    renderButton({ hasNextPage: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it('mostra o erro e "Tentar novamente" junto ao botão, que pede a página de novo', () => {
    const { onLoadMore } = renderButton({ error: true });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar mais animes.");
    expect(screen.getByRole("button", { name: "Ver mais" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});
