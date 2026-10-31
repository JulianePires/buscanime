import { useRef, useState } from "react";
import type { Anime } from "../../domain/anime";
import { AnimeCard } from "./AnimeCard";
import { AnimeDetailDialog } from "./AnimeDetailDialog";
import { ANIME_GRID_CLASS_NAME } from "./grid-layout";

interface AnimeGridProps {
  animes: Anime[];
  /** Nova combinação de filtros carregando: a lista atual fica visível, esmaecida. */
  busy?: boolean;
  /** Card que recebe o foco ao entrar na lista: o primeiro novo depois do "Ver mais" (UC06). */
  focusIndex?: number;
}

/** Ref de callback estável: roda quando o card alvo monta, não a cada render. */
const focusOnMount = (button: HTMLButtonElement | null) => button?.focus();

/**
 * Só a primeira capa é prioritária: é o LCP em qualquer largura. Antecipar a linha inteira
 * fez as capas disputarem banda no mobile (1 coluna) e piorou o LCP no Lighthouse.
 *
 * O detalhe (UC03) mostra o anime já carregado na lista, sem nova requisição. Ao fechar, o foco
 * volta ao botão do card que o abriu (nem todo navegador foca o botão no clique).
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
