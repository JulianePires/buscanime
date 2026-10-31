import { useRef, useState } from "react";
import type { Anime } from "../../domain/anime";
import { AnimeCard } from "./AnimeCard";
import { AnimeDetailDialog } from "./AnimeDetailDialog";
import { ANIME_GRID_CLASS_NAME } from "./grid-layout";

interface AnimeGridProps {
  animes: Anime[];
}

/**
 * Só a primeira capa é prioritária: é o LCP em qualquer largura. Antecipar a linha inteira
 * fez as capas disputarem banda no mobile (1 coluna) e piorou o LCP no Lighthouse.
 *
 * O detalhe (UC03) mostra o anime já carregado na lista, sem nova requisição. Ao fechar, o foco
 * volta ao botão do card que o abriu (nem todo navegador foca o botão no clique).
 */
export function AnimeGrid({ animes }: AnimeGridProps) {
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
      <ul aria-label="Animes" className={ANIME_GRID_CLASS_NAME}>
        {animes.map((anime, index) => (
          <li key={anime.id}>
            <AnimeCard
              anime={anime}
              priority={index === 0}
              onSelect={(trigger) => openDetail(anime, trigger)}
            />
          </li>
        ))}
      </ul>
      {selected && <AnimeDetailDialog anime={selected} onClose={closeDetail} />}
    </>
  );
}
