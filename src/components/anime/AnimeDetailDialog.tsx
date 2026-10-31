import { Fragment, useEffect, useId, useRef } from "react";
import type { Anime } from "../../domain/anime";
import { formatLabel } from "../../domain/formats";
import { statusLabel } from "../../domain/status";
import { GenreChip } from "./GenreChip";
import { ScoreBadge } from "./ScoreBadge";

/** Proporção das capas do AniList (extraLarge ≈ 460 × 650); reserva o espaço sem CLS. */
const COVER_WIDTH = 230;
const COVER_HEIGHT = 325;

interface AnimeDetailDialogProps {
  anime: Anime;
  /** Chamado depois que o diálogo fecha (Esc ou "Fechar"); quem abriu devolve o foco. */
  onClose: () => void;
}

/** Termo → valor da lista de dados; o que o AniList não informou fica de fora. */
function toFacts(anime: Anime) {
  const facts = [
    { term: "Formato", value: anime.format && formatLabel(anime.format) },
    { term: "Episódios", value: anime.episodes },
    { term: "Ano", value: anime.seasonYear },
    { term: "Situação", value: anime.status && statusLabel(anime.status) },
  ];
  return facts.filter((fact) => fact.value !== null);
}

function AnimeFacts({ anime }: { anime: Anime }) {
  const facts = toFacts(anime);
  if (facts.length === 0) return null;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {facts.map(({ term, value }) => (
        <Fragment key={term}>
          <dt className="font-semibold text-primary">{term}</dt>
          <dd className="text-black">{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function AnimeSynopsis({ description }: { description: string }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1">
      <h3 id={headingId} className="font-semibold text-primary text-sm">
        Sinopse
      </h3>
      <p className="whitespace-pre-line text-black text-sm/relaxed">{description}</p>
    </section>
  );
}

/**
 * Detalhe do anime (UC03). Não existe no Figma: derivado dos tokens e do card (superfície
 * branca, raio do card, título H3/Bold em primary, chips e nota do UC02). <dialog> nativo com
 * showModal(): o navegador cuida do backdrop, do foco preso e do Esc.
 */
export function AnimeDetailDialog({ anime, onClose }: AnimeDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[720px] overflow-y-auto rounded-card bg-white p-6 backdrop:bg-black/60"
    >
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
          <AnimeFacts anime={anime} />
          {anime.description && <AnimeSynopsis description={anime.description} />}
          {anime.siteUrl && (
            <a
              href={anime.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="self-start font-semibold text-primary text-sm underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              Ver no AniList<span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
        </div>
      </div>
    </dialog>
  );
}
