import { describe, expect, it } from "vitest";
import { ANIME_STATUSES } from "./anime";
import { statusLabel } from "./status";

describe("statusLabel", () => {
  it.each([
    ["FINISHED", "Finalizado"],
    ["RELEASING", "Em exibição"],
    ["NOT_YET_RELEASED", "Não lançado"],
    ["CANCELLED", "Cancelado"],
    ["HIATUS", "Em hiato"],
  ] as const)("%s → %s", (status, label) => {
    expect(statusLabel(status)).toBe(label);
  });

  it("tem rótulo para toda situação do domínio", () => {
    expect(ANIME_STATUSES.map(statusLabel).every(Boolean)).toBe(true);
  });
});
