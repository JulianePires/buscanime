import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEARCH_DEBOUNCE_MS, SearchBar } from "./SearchBar";

function renderSearchBar(defaultValue?: string) {
  const onSearch = vi.fn<(term: string) => void>();
  const view = render(<SearchBar defaultValue={defaultValue} onSearch={onSearch} />);
  return { onSearch, view, input: screen.getByRole("searchbox", { name: "Buscar anime" }) };
}

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

describe("SearchBar (specs/busca.md)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fica num form role="search" com o campo rotulado "Buscar anime" e o placeholder do design', () => {
    const { input } = renderSearchBar();

    expect(screen.getByRole("search")).toContainElement(input);
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute("placeholder", "Digite algo aqui...");
    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute("type", "submit");
  });

  it('chama onSearch uma vez com o termo ao acionar "Buscar", sem esperar o debounce', () => {
    const { onSearch, input } = renderSearchBar();

    type(input, "one piece");
    expect(onSearch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    // O submit cancela a busca agendada pela digitação
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith("one piece");
  });

  it("chama onSearch uma vez com o termo ao pressionar Enter (submit do formulário)", () => {
    const { onSearch, input } = renderSearchBar();

    type(input, "naruto");
    fireEvent.submit(input);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

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

  describe("debounce da digitação", () => {
    it(`busca uma vez com o último texto ${SEARCH_DEBOUNCE_MS} ms depois da última tecla`, () => {
      const { onSearch, input } = renderSearchBar();

      type(input, "n");
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      type(input, "na");
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      type(input, "naruto");
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      expect(onSearch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);

      expect(onSearch).toHaveBeenCalledOnce();
      expect(onSearch).toHaveBeenCalledWith("naruto");
    });

    it("limpar o campo também busca (remove o filtro)", () => {
      const { onSearch, input } = renderSearchBar("bleach");

      type(input, "");
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(onSearch).toHaveBeenCalledWith("");
    });

    it("não busca depois que o componente sai da tela", () => {
      const { onSearch, input, view } = renderSearchBar();

      type(input, "naruto");
      view.unmount();
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(onSearch).not.toHaveBeenCalled();
    });
  });
});
