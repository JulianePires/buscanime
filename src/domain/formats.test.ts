import { describe, expect, it } from "vitest";
import { FORMAT_OPTIONS, formatLabel } from "./formats";

describe("FORMAT_OPTIONS (specs/filtros.md)", () => {
  it("segue a ordem do design; All Formats não tem valor", () => {
    expect(FORMAT_OPTIONS.map((option) => [option.label, option.value])).toEqual([
      ["All Formats", null],
      ["TV Show", "TV"],
      ["Movie", "MOVIE"],
      ["TV Short", "TV_SHORT"],
      ["Special", "SPECIAL"],
      ["OVA", "OVA"],
      ["ONA", "ONA"],
      ["Music", "MUSIC"],
    ]);
  });
});

describe("formatLabel", () => {
  it.each([
    ["TV", "TV Show"],
    ["TV_SHORT", "TV Short"],
    ["MOVIE", "Movie"],
  ] as const)("%s → %s", (format, label) => {
    expect(formatLabel(format)).toBe(label);
  });
});
