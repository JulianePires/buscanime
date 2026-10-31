import { formatScore, type ScoreTone, scoreTone } from "../../domain/score";

/** Sobre warning e success, o texto gray-light-2 do Figma não passa no contraste: fica escuro. */
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
