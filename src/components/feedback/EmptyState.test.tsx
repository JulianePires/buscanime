import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("anuncia a lista vazia", () => {
    render(<EmptyState />);

    expect(screen.getByRole("status")).toHaveTextContent("Nenhum anime encontrado.");
  });

  it("informa o termo pesquisado", () => {
    render(<EmptyState term="xyz" />);

    expect(screen.getByRole("status")).toHaveTextContent('Nenhum anime encontrado para "xyz"');
  });
});
