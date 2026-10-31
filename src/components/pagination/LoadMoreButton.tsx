interface LoadMoreButtonProps {
  hasNextPage: boolean;
  loading?: boolean;
  error?: boolean;
  onLoadMore: () => void;
}

/** Texto branco do Figma (≈ 1,7:1, abaixo do AA) até a decisão de contraste do plano. */
export function LoadMoreButton({
  hasNextPage,
  loading = false,
  error = false,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (!hasNextPage) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-4 text-primary">
          <p>Não foi possível carregar mais animes.</p>
          <button
            type="button"
            onClick={onLoadMore}
            className="h-8 cursor-pointer rounded-control bg-primary px-4 font-semibold text-sm text-white transition-colors hover:bg-primary-light-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Tentar novamente
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loading}
        aria-busy={loading || undefined}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-load-more bg-warning font-semibold text-white text-xl transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-progress disabled:opacity-80"
      >
        <img src="/icons/add.svg" alt="" width="30" height="24" />
        {loading ? "Carregando..." : "Ver mais"}
      </button>
    </div>
  );
}
