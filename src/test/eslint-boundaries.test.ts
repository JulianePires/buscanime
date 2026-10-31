// @vitest-environment node
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const apolloImport = [
  'import { useSuspenseQuery } from "@apollo/client/react";',
  "export const hook = useSuspenseQuery;",
  "",
].join("\n");

async function restrictedImportErrors(filePath: string) {
  const [result] = await new ESLint().lintText(apolloImport, { filePath });
  return result.messages.filter((message) => message.ruleId === "no-restricted-imports");
}

describe("Fronteira da camada de dados (ADR-003)", () => {
  it("proíbe importar o Apollo em src/components", async () => {
    const errors = await restrictedImportErrors("src/components/anime/AnimeCard.tsx");

    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe(2);
  }, 30_000);

  it.each(["src/App.tsx", "src/domain/anime.ts"])(
    "proíbe também em %s",
    async (filePath) => {
      expect(await restrictedImportErrors(filePath)).toHaveLength(1);
    },
    30_000,
  );

  it.each(["src/services/anilist/apollo-client.ts", "src/features/catalog/use-catalog.ts"])(
    "permite em %s",
    async (filePath) => {
      expect(await restrictedImportErrors(filePath)).toHaveLength(0);
    },
    30_000,
  );
});
