import { AnimeGrid } from "../../components/anime/AnimeGrid";
import { EmptyState } from "../../components/feedback/EmptyState";
import { useCatalog } from "./use-catalog";

/** Liga a facade à apresentação. Suspende na primeira carga; erros sobem para o Error Boundary. */
export function CatalogResults() {
  const { animes } = useCatalog();
  if (animes.length === 0) return <EmptyState />;
  return <AnimeGrid animes={animes} />;
}
