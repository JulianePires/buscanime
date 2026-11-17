import { Fragment, useId } from "react";
import type { AnimeDetail } from "../../domain/anime";
import { formatLabel } from "../../domain/formats";
import { statusLabel } from "../../domain/status";

function toFacts(detail: AnimeDetail) {
  const facts = [
    { term: "Formato", value: detail.format && formatLabel(detail.format) },
    { term: "Episódios", value: detail.episodes },
    { term: "Ano", value: detail.seasonYear },
    { term: "Situação", value: detail.status && statusLabel(detail.status) },
  ];
  return facts.filter((fact) => fact.value !== null);
}

function AnimeFacts({ detail }: { detail: AnimeDetail }) {
  const facts = toFacts(detail);
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

/** Corpo do modal com o que só a consulta do detalhe traz (UC08). */
export function AnimeDetailInfo({ detail }: { detail: AnimeDetail }) {
  return (
    <>
      <AnimeFacts detail={detail} />
      {detail.description && <AnimeSynopsis description={detail.description} />}
      {detail.siteUrl && (
        <a
          href={detail.siteUrl}
          target="_blank"
          rel="noreferrer"
          className="self-start font-semibold text-primary text-sm underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          Ver no AniList<span className="sr-only"> (abre em nova aba)</span>
        </a>
      )}
    </>
  );
}
