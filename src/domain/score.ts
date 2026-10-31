// Regra de negócio da nota média (docs/DESIGN.md, "Cor da nota"): os limites 50 e 80 são amarelos.

export type ScoreTone = "danger" | "warning" | "success";

interface ScoreRange {
  tone: ScoreTone;
  contains: (score: number) => boolean;
}

/** Faixas como dados (lookup table): nova faixa é uma linha, não um `if`. */
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
