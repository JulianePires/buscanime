import { Suspense, useState } from "react";
import { AnimeDetailDialog } from "../../components/anime/AnimeDetailDialog";
import { AnimeDetailInfo } from "../../components/anime/AnimeDetailInfo";
import { AnimeDetailSkeleton } from "../../components/anime/AnimeDetailSkeleton";
import { ErrorBoundary } from "../../components/feedback/ErrorBoundary";
import type { Anime } from "../../domain/anime";
import { useAnimeDetail } from "./use-anime-detail";

interface AnimeDetailProps {
  anime: Anime;
  onClose: () => void;
}

function AnimeDetailContent({ id, attempt }: { id: number; attempt: number }) {
  return <AnimeDetailInfo detail={useAnimeDetail(id, attempt)} />;
}

/**
 * O modal abre na hora com o resumo do card; só o corpo espera a consulta do detalhe. O Suspense
 * e o Error Boundary ficam dentro do modal: carregar ou falhar aqui não mexe na listagem.
 */
export function AnimeDetail({ anime, onClose }: AnimeDetailProps) {
  const [attempt, setAttempt] = useState(0);

  return (
    <AnimeDetailDialog anime={anime} onClose={onClose}>
      <ErrorBoundary
        message="Não foi possível carregar os detalhes."
        onReset={() => setAttempt((current) => current + 1)}
      >
        <Suspense fallback={<AnimeDetailSkeleton />}>
          <AnimeDetailContent id={anime.id} attempt={attempt} />
        </Suspense>
      </ErrorBoundary>
    </AnimeDetailDialog>
  );
}
