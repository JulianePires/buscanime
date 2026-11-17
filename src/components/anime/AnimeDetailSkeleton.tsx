/** Ocupa o lugar dos fatos e da sinopse enquanto a consulta do detalhe não chega (UC08, RNF06). */
export function AnimeDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Carregando detalhes</span>
      <div aria-hidden="true" className="flex flex-col gap-4 motion-safe:animate-pulse">
        <div data-skeleton className="h-19 w-48 rounded-control bg-gray-light-2" />
        <div className="flex flex-col gap-2">
          <div data-skeleton className="h-4 w-20 rounded-control bg-gray-light-2" />
          <div data-skeleton className="h-4 w-full rounded-control bg-gray-light-2" />
          <div data-skeleton className="h-4 w-full rounded-control bg-gray-light-2" />
          <div data-skeleton className="h-4 w-2/3 rounded-control bg-gray-light-2" />
        </div>
      </div>
    </div>
  );
}
