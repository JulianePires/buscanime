// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface DesignTokens {
  color: Record<string, { value: string }>;
}

const tokens: DesignTokens = JSON.parse(readFileSync("docs/design-context/tokens.json", "utf8"));
const css = readFileSync("src/index.css", "utf8");
const theme = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

function themeValue(name: string) {
  return new RegExp(`--${name}:\\s*([^;]+);`).exec(theme)?.[1].trim();
}

// ADR-001: tokens.json é a referência; o @theme do Tailwind é a implementação
describe("Tokens de design", () => {
  it.each(Object.entries(tokens.color))("define --color-%s no @theme", (name, { value }) => {
    expect(themeValue(`color-${name}`)?.toUpperCase()).toBe(value.toUpperCase());
  });
});
