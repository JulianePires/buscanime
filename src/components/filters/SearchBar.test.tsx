import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";

function renderSearchBar(term?: string) {
  const onSearch = vi.fn<(term: string) => void>();
  const view = render(<SearchBar term={term} onSearch={onSearch} />);
  const rerender = (next?: string) => view.rerender(<SearchBar term={next} onSearch={onSearch} />);
  return { onSearch, rerender, input: screen.getByRole("searchbox", { name: "Buscar anime" }) };
}

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

describe("SearchBar (specs/busca.md)", () => {
  it('fica num form role="search" com o campo rotulado "Buscar anime" e o placeholder do design', () => {
    const { input } = renderSearchBar();

    expect(screen.getByRole("search")).toContainElement(input);
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute("placeholder", "Digite algo aqui...");
    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute("type", "submit");
  });

  it("digitar não busca: sem debounce, quem dispara a busca é o botão ou o Enter", async () => {
    const { onSearch, input } = renderSearchBar();

    type(input, "n");
    type(input, "naruto");
    type(input, "");
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('chama onSearch uma vez com o termo ao acionar "Buscar"', () => {
    const { onSearch, input } = renderSearchBar();

    type(input, "one piece");
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith("one piece");
  });

  it("chama onSearch uma vez com o termo ao pressionar Enter (submit do formulário)", () => {
    const { onSearch, input } = renderSearchBar();

    type(input, "naruto");
    fireEvent.submit(input);

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith("naruto");
  });

  it("começa com o termo atual e o mantém no campo depois da busca", () => {
    const { onSearch, input } = renderSearchBar("bleach");
    expect(input).toHaveValue("bleach");

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSearch).toHaveBeenCalledWith("bleach");
    expect(input).toHaveValue("bleach");
  });

  describe("termo trocado por fora (voltar/avançar do navegador, UC09)", () => {
    it("o campo passa a mostrar o novo termo, e o termo vazio limpa o campo", () => {
      const { rerender, input } = renderSearchBar("bleach");

      rerender("naruto");
      expect(input).toHaveValue("naruto");

      rerender(undefined);
      expect(input).toHaveValue("");
    });

    it("o mesmo termo, só normalizado, não reescreve o que o visitante digitou", () => {
      const { rerender, input } = renderSearchBar();
      type(input, "  one piece ");

      rerender("one piece");

      expect(input).toHaveValue("  one piece ");
    });
  });
});
