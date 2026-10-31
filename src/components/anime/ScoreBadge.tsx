import { formatScore, type ScoreTone, scoreTone } from "../../domain/score";

/**
 * Fundo pelo tom (Figma). O texto gray-light-2 do Figma só atinge 3:1 sobre danger; sobre
 * warning (1,37:1) e success (2,21:1) o texto fica escuro para cumprir o WCAG (RNF01).
 */
const TONE_CLASSES: Record<ScoreTone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
};

interface ScoreBadgeProps {
  score: number | null;
  className?: string;
}

export function ScoreBadge({ score, className = "" }: ScoreBadgeProps) {
  const tone = scoreTone(score);
  if (score === null || !tone) return null;

  return (
    <p
      data-tone={tone}
      className={`cursor-default rounded-control px-2 py-0.75 text-gray-light-2 font-normal text-2xl/[normal] ${TONE_CLASSES[tone]} ${className}`}
    >
      <span className="sr-only">Nota média: </span>
      <span>{formatScore(score)}</span>
    </p>
  );
}
