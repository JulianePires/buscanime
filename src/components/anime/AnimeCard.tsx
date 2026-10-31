import { type Ref, useId } from "react";
import type { Anime } from "../../domain/anime";
import { GenreChip } from "./GenreChip";
import { ScoreBadge } from "./ScoreBadge";

const CARD_WIDTH = 317;
const CARD_HEIGHT = 270;

interface AnimeCardProps {
  anime: Anime;
  priority?: boolean;
  /** Recebe o botão acionado, que volta a ter o foco quando o detalhe fecha. */
  onSelect: (trigger: HTMLButtonElement) => void;
  ref?: Ref<HTMLButtonElement>;
}

/** O anel de foco fica no article: o overflow-hidden cortaria o do botão que cobre o card. */
export function AnimeCard({ anime, priority = false, onSelect, ref }: AnimeCardProps) {
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className="relative aspect-317/270 overflow-hidden rounded-card bg-primary hover:cursor-pointer hover:brightness-80 has-focus-visible:ring-2 has-focus-visible:ring-primary-light-1 has-focus-visible:ring-offset-2 transform transition-all duration-150 hover:scale-[1.01]"
      style={{ backgroundColor: anime.coverColor ?? undefined }}
    >
      {anime.coverUrl && (
        <img
          src={anime.coverUrl}
          alt=""
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          fetchPriority={priority ? "high" : "auto"}
          loading="eager"
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
      <button
        ref={ref}
        type="button"
        aria-labelledby={titleId}
        onClick={(event) => onSelect(event.currentTarget)}
        className="absolute inset-0 cursor-pointer focus-visible:outline-none"
      />
    </article>
  );
}
