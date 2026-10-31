import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("anuncia o carregamento e reserva o espaço dos cards sem expô-los", () => {
    const { container } = render(<LoadingState count={12} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando animes");
    expect(container.querySelectorAll("[data-skeleton]")).toHaveLength(12);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
