import { useRef, useState } from "react";
import type { Anime } from "../../domain/anime";
import { AnimeCard } from "./AnimeCard";
import { AnimeDetailDialog } from "./AnimeDetailDialog";
import { ANIME_GRID_CLASS_NAME } from "./grid-layout";

interface AnimeGridProps {
  animes: Anime[];
  busy?: boolean;
  /** Índice do card que recebe o foco ao montar: o primeiro novo depois do "Ver mais". */
  focusIndex?: number;
}

// Fora do componente para ter identidade estável: só roda quando o card alvo monta
const focusOnMount = (button: HTMLButtonElement | null) => button?.focus();

/**
 * Só a primeira capa é prioritária: priorizar a linha inteira fez as capas disputarem banda no
 * celular. O foco volta pelo ref porque nem todo navegador foca o botão no clique.
 */
export function AnimeGrid({ animes, busy = false, focusIndex }: AnimeGridProps) {
  const [selected, setSelected] = useState<Anime | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openDetail(anime: Anime, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelected(anime);
  }

  function closeDetail() {
    setSelected(null);
    triggerRef.current?.focus();
  }

  return (
    <>
      <ul
        aria-label="Animes"
        aria-busy={busy || undefined}
        className={`${ANIME_GRID_CLASS_NAME} transition-opacity aria-busy:opacity-60`}
      >
        {animes.map((anime, index) => (
          <li key={anime.id}>
            <AnimeCard
              anime={anime}
              priority={index === 0}
              ref={index === focusIndex ? focusOnMount : undefined}
              onSelect={(trigger) => openDetail(anime, trigger)}
            />
          </li>
        ))}
      </ul>
      {selected && <AnimeDetailDialog anime={selected} onClose={closeDetail} />}
    </>
  );
}
