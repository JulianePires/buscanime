// Os limites 50 e 80 são amarelos (docs/DESIGN.md), embora o Figma mostre 80 em verde.

export type ScoreTone = "danger" | "warning" | "success";

interface ScoreRange {
  tone: ScoreTone;
  contains: (score: number) => boolean;
}

const SCORE_RANGES: readonly ScoreRange[] = [
  { tone: "danger", contains: (score) => score < 50 },
  { tone: "warning", contains: (score) => score >= 50 && score <= 80 },
  { tone: "success", contains: (score) => score > 80 },
];

export function scoreTone(score: number | null): ScoreTone | undefined {
  if (score === null) return undefined;
  return SCORE_RANGES.find((range) => range.contains(score))?.tone;
}

export function formatScore(score: number) {
  return `${score}%`;
}
