import { ANIME_GRID_CLASS_NAME } from "../anime/grid-layout";

interface LoadingStateProps {
  /** Quantos cards reservar: o tamanho da página pedida. */
  count: number;
}

/** Esqueleto na mesma grade e proporção dos cards: a lista entra sem deslocar o rodapé (CLS 0). */
export function LoadingState({ count }: LoadingStateProps) {
  return (
    <div role="status">
      <span className="sr-only">Carregando animes</span>
      <div aria-hidden="true" className={ANIME_GRID_CLASS_NAME}>
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            data-skeleton
            className="aspect-317/270 rounded-card bg-gray-light-2 motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
