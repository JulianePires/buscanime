import process from "node:process";
import type { CodegenConfig } from "@graphql-codegen/cli";

// Dois alvos (ADR-003):
//   pnpm codegen:schema → baixa o schema do AniList para src/services/anilist/schema.graphql
//                         (versionado: CI offline e reprodutível, como a base do ADR-001)
//   pnpm codegen        → gera os tipos das operações (*.generated.ts, fora do Git) a partir do
//                         schema local, na configuração recomendada pela doc do Apollo Client 4
const ANILIST_URL = "https://graphql.anilist.co";
const SCHEMA_FILE = "src/services/anilist/schema.graphql";
const SCHEMA_TYPES_FILE = "src/services/anilist/schema-types.generated.ts";

// O pnpm informa o script em execução; só `pnpm codegen:schema` acessa a rede
const target = process.env.npm_lifecycle_event === "codegen:schema" ? "schema" : "operations";

const schemaConfig: CodegenConfig = {
  overwrite: true,
  schema: ANILIST_URL,
  generates: {
    [SCHEMA_FILE]: {
      plugins: ["schema-ast"],
      config: { includeDirectives: false, commentDescriptions: false },
    },
  },
};

const operationsConfig: CodegenConfig = {
  overwrite: true,
  schema: SCHEMA_FILE,
  documents: ["src/**/*.graphql.ts"],
  ignoreNoDocuments: true,
  generates: {
    // Enums e inputs usados pelas operações (typescript-operations v6)
    [SCHEMA_TYPES_FILE]: {
      plugins: ["typescript-operations"],
      config: { generateOperationTypes: false, enumType: "string-literal" },
    },
    "src/": {
      preset: "near-operation-file",
      presetConfig: { extension: ".generated.ts", folder: "./" },
      plugins: ["typescript-operations", "typed-document-node"],
      config: {
        importSchemaTypesFrom: `./${SCHEMA_TYPES_FILE}`,
        enumType: "string-literal",
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        useTypeImports: true,
      },
    },
  },
};

export default target === "schema" ? schemaConfig : operationsConfig;
