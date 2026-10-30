import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.js"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        exclude: ["src/main.tsx", "src/vite-env.d.ts"],
      },
    },
  }),
);
