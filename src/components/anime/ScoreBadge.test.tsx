import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreBadge } from "./ScoreBadge";

describe("ScoreBadge", () => {
  it.each([
    [49, "danger", "bg-danger"],
    [50, "warning", "bg-warning"],
    [80, "warning", "bg-warning"],
    [81, "success", "bg-success"],
  ] as const)("nota %i usa o tom %s", (score, tone, background) => {
    render(<ScoreBadge score={score} />);

    const badge = screen.getByText(`${score}%`).closest("[data-tone]");
    expect(badge).toHaveAttribute("data-tone", tone);
    expect(badge).toHaveClass(background);
  });

  it("anuncia o que o número significa para leitores de tela", () => {
    render(<ScoreBadge score={72} />);

    expect(screen.getByText("72%").closest("[data-tone]")).toHaveTextContent("Nota média: 72%");
  });

  it("não renderiza nada sem nota", () => {
    const { container } = render(<ScoreBadge score={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
