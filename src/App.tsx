import { Suspense } from "react";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { LoadingState } from "./components/feedback/LoadingState";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { CatalogResults } from "./features/catalog/CatalogResults";
import { initialCatalogFilters } from "./features/catalog/catalog-filters-reducer";
import { useCatalogRetry } from "./features/catalog/use-catalog";

function App() {
  const retry = useCatalogRetry();

  return (
    <div className="flex flex-col gap-section">
      <SiteHeader />
      {/* O limite de 1316 px vale para o conteúdo; o gutter fica por fora (layout.md) */}
      <main className="mx-auto w-full max-w-[calc(var(--container-content)+2*var(--spacing-gutter))] px-4 sm:px-gutter">
        <h1 className="sr-only">Busca de animes</h1>
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
