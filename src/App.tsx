import { Suspense } from "react";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { LoadingState } from "./components/feedback/LoadingState";
import { FormatFilter } from "./components/filters/FormatFilter";
import { SearchBar } from "./components/filters/SearchBar";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { CatalogResults } from "./features/catalog/CatalogResults";
import { initialCatalogFilters } from "./features/catalog/catalog-filters-reducer";
import { useCatalogFilters, useCatalogRetry } from "./features/catalog/use-catalog";

function App() {
  const retry = useCatalogRetry();
  const { selectedFilters, toggleFormat, clearFormats, search } = useCatalogFilters();

  return (
    <div className="flex flex-col gap-section">
      <SiteHeader />
      {/* O limite de 1316 px vale para o conteúdo; o gutter fica por fora (layout.md) */}
      <main className="mx-auto flex w-full max-w-[calc(var(--container-content)+2*var(--spacing-gutter))] flex-col gap-section px-4 sm:px-gutter">
        <h1 className="sr-only">Busca de animes</h1>
        {/* Fora do Suspense: os filtros continuam visíveis enquanto a lista carrega */}
        <FormatFilter
          selected={selectedFilters.formats}
          onToggle={toggleFormat}
          onClear={clearFormats}
        />
        <SearchBar defaultValue={selectedFilters.search} onSearch={search} />
        <ErrorBoundary onReset={retry}>
          <Suspense fallback={<LoadingState count={initialCatalogFilters.perPage} />}>
            <CatalogResults />
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
