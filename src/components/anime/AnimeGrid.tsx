import type { Anime } from "../../domain/anime";
import { AnimeCard } from "./AnimeCard";
import { ANIME_GRID_CLASS_NAME } from "./grid-layout";

interface AnimeGridProps {
  animes: Anime[];
}

/**
 * Só a primeira capa é prioritária: é o LCP em qualquer largura. Antecipar a linha inteira
 * fez as capas disputarem banda no mobile (1 coluna) e piorou o LCP no Lighthouse.
 */
export function AnimeGrid({ animes }: AnimeGridProps) {
  return (
    <ul aria-label="Animes" className={ANIME_GRID_CLASS_NAME}>
      {animes.map((anime, index) => (
        <li key={anime.id}>
          <AnimeCard anime={anime} priority={index === 0} />
        </li>
      ))}
    </ul>
  );
}
