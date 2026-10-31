/**
 * Itens por página conforme a largura da tela: até 600 px, 3; até 919 px, 6; até 1219 px, 9; a
 * partir de 1220 px, 12 (o frame do Figma). `minWidth` é o início de cada faixa.
 */
const PAGE_SIZE_BANDS = [
  { minWidth: 1220, perPage: 12 },
  { minWidth: 920, perPage: 9 },
  { minWidth: 601, perPage: 6 },
  { minWidth: 0, perPage: 3 },
] as const;

export function pageSizeForWidth(width: number) {
  return PAGE_SIZE_BANDS.find((band) => width >= band.minWidth)?.perPage ?? 3;
}

/** Uma media query por início de faixa: o "change" dispara só quando a faixa muda. */
export const PAGE_SIZE_MEDIA_QUERIES = PAGE_SIZE_BANDS.filter((band) => band.minWidth > 0)
  .map((band) => `(min-width: ${band.minWidth}px)`)
  .reverse();
