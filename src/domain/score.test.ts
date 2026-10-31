import { describe, expect, it } from "vitest";
import figmaCards from "../../docs/design-context/fixtures/figma-cards.json";
import { formatScore, scoreTone } from "./score";

describe("scoreTone", () => {
  it.each([
    [0, "danger"],
    [49, "danger"],
    [50, "warning"],
    [80, "warning"],
    [81, "success"],
    [100, "success"],
  ] as const)("nota %i → %s", (score, tone) => {
    expect(scoreTone(score)).toBe(tone);
  });

  it("sem nota não tem tom", () => {
    expect(scoreTone(null)).toBeUndefined();
  });

  // A regra de negócio vale sobre o Figma (o card de 80% aparece verde no design)
  it.each(figmaCards.cards)("$title ($averageScore%) → $expectedColor", (card) => {
    expect(scoreTone(card.averageScore)).toBe(card.expectedColor);
  });
});

describe("formatScore", () => {
  it("exibe a nota em percentual", () => {
    expect(formatScore(80)).toBe("80%");
  });
});
