import { useId } from "react";
import type { Anime } from "../../domain/anime";
import { GenreChip } from "./GenreChip";
import { ScoreBadge } from "./ScoreBadge";

/** Dimensões do card no Figma; viram width/height da capa para reservar espaço (sem CLS). */
const CARD_WIDTH = 317;
const CARD_HEIGHT = 270;

interface AnimeCardProps {
  anime: Anime;
  /** Capa candidata a LCP: sem lazy e com fetchpriority alto (RNF02). */
  priority?: boolean;
}

/** Card 317 × 270 do Figma (specs/card.md). O botão que abre o detalhe chega no UC03. */
export function AnimeCard({ anime, priority = false }: AnimeCardProps) {
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="relative aspect-317/270 overflow-hidden rounded-card bg-primary"
      // Cor média da capa (AniList) enquanto a imagem carrega
      style={{ backgroundColor: anime.coverColor ?? undefined }}
    >
      {anime.coverUrl && (
        <img
          src={anime.coverUrl}
          alt=""
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.17)_105%)]" />
      <div className="absolute inset-x-7 top-5.75 flex flex-col gap-2.75">
        <h2 id={titleId} className="line-clamp-3 font-bold text-2xl/[normal] text-white">
          {anime.title}
        </h2>
        {anime.genres.length > 0 && (
          <ul aria-label="Gêneros" className="flex flex-wrap gap-2.75">
            {anime.genres.map((genre) => (
              <GenreChip key={genre} genre={genre} />
            ))}
          </ul>
        )}
      </div>
      <ScoreBadge score={anime.averageScore} className="absolute right-2 bottom-2" />
    </article>
  );
}
