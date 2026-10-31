import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenreChip } from "./GenreChip";

describe("GenreChip", () => {
  it("é um item de lista com o nome do gênero", () => {
    render(
      <ul>
        <GenreChip genre="Action" />
      </ul>,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("Action");
  });
});
