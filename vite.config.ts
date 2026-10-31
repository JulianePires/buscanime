import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin, runnerImport } from "vite";

// Tipos mínimos: importar os módulos de src/ aqui os traria para o tsconfig.node
interface PrefetchModule {
  animePagePrefetchConfig: (filters: unknown, url: string) => unknown;
  animePagePrefetchScript: (config: unknown) => string;
}

const PREFETCH_MARKER = "<!-- anime-page-prefetch -->";

/** Pedido da primeira página antes do bundle (src/services/anilist/prefetch.ts). */
function animePagePrefetch(): Plugin {
  return {
    name: "buscanime:anime-page-prefetch",
    apply: "build",
    async transformIndexHtml(html) {
      const [{ module: prefetch }, { module: client }, { module: filters }] = await Promise.all([
        runnerImport<PrefetchModule>("/src/services/anilist/prefetch.ts"),
        runnerImport<{ ANILIST_URL: string }>("/src/services/anilist/apollo-client.ts"),
        runnerImport<{ initialCatalogFilters: unknown }>(
          "/src/features/catalog/catalog-filters-reducer.ts",
        ),
      ]);
      const config = prefetch.animePagePrefetchConfig(
        filters.initialCatalogFilters,
        client.ANILIST_URL,
      );
      if (!html.includes(PREFETCH_MARKER)) {
        throw new Error(`index.html sem o marcador ${PREFETCH_MARKER} do prefetch`);
      }
      return html.replace(
        PREFETCH_MARKER,
        `<script>${prefetch.animePagePrefetchScript(config)}</script>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    animePagePrefetch(),
  ],
});
