import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import type { Anime } from "../../domain/anime";
import { GenreChip } from "./GenreChip";
import { ScoreBadge } from "./ScoreBadge";

/** Proporção das capas extraLarge do AniList (≈ 460 × 650). */
const COVER_WIDTH = 230;
const COVER_HEIGHT = 325;

interface AnimeDetailDialogProps {
  /** O resumo do card: o modal abre na hora, sem esperar a consulta do detalhe (UC08). */
  anime: Anime;
  onClose: () => void;
  /** O corpo que depende da consulta do detalhe (fatos, sinopse, link), com seus estados. */
  children?: ReactNode;
}

/**
 * Fecha o `<dialog>` modal pelo clique no overlay (UC07), à mão porque o `closedby="any"` não é
 * Baseline. O ::backdrop pertence ao `<dialog>` e o conteúdo preenche a superfície, então um
 * evento com o próprio `<dialog>` como alvo veio do overlay. Exigir também o pointerdown ali evita
 * fechar ao arrastar uma seleção de texto do conteúdo para fora.
 */
function useBackdropClose() {
  const pressedOnBackdrop = useRef(false);

  return {
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      pressedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick(event: MouseEvent<HTMLDialogElement>) {
      if (pressedOnBackdrop.current && event.target === event.currentTarget) {
        event.currentTarget.close();
      }
      pressedOnBackdrop.current = false;
    },
  };
}

/** `<dialog>` com showModal(): o navegador cuida do backdrop, do foco preso e do Esc. */
export function AnimeDetailDialog({ anime, onClose, children }: AnimeDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropClose = useBackdropClose();
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      {...backdropClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[720px] overflow-y-auto overscroll-contain rounded-card bg-white p-0 backdrop:bg-black/60"
    >
      {/* O padding fica aqui, não no <dialog>: assim só o overlay tem o <dialog> como alvo */}
      <div className="p-6">
        <title>{`${anime.title} | Buscanime`}</title>
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="font-bold text-2xl/[normal] text-primary">
              {anime.title}
            </h2>
            {anime.englishTitle && <p className="text-black text-sm">{anime.englishTitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-8 shrink-0 cursor-pointer rounded-control border border-primary px-4 font-semibold text-primary text-sm hover:bg-primary-light-1/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Fechar
          </button>
        </header>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          {anime.coverUrl && (
            <img
              src={anime.coverUrl}
              alt=""
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              decoding="async"
              className="aspect-230/325 w-40 self-start rounded-card object-cover sm:w-57.5"
              style={{ backgroundColor: anime.coverColor ?? undefined }}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.75">
              {anime.genres.length > 0 && (
                <ul aria-label="Gêneros" className="flex flex-wrap gap-2.75">
                  {anime.genres.map((genre) => (
                    <GenreChip key={genre} genre={genre} />
                  ))}
                </ul>
              )}
              <ScoreBadge score={anime.averageScore} />
            </div>
            {children}
          </div>
        </div>
      </div>
    </dialog>
  );
}
