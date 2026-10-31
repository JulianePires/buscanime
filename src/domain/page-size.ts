/** `minWidth` é o início de cada faixa; a de 12 itens é o frame desktop do Figma. */
export const PAGE_SIZE_BANDS = [
  { minWidth: 1220, perPage: 12 },
  { minWidth: 920, perPage: 9 },
  { minWidth: 601, perPage: 6 },
  { minWidth: 0, perPage: 3 },
] as const;

export function pageSizeForWidth(width: number) {
  return PAGE_SIZE_BANDS.find((band) => width >= band.minWidth)?.perPage ?? 3;
}

export const PAGE_SIZE_MEDIA_QUERIES = PAGE_SIZE_BANDS.filter((band) => band.minWidth > 0)
  .map((band) => `(min-width: ${band.minWidth}px)`)
  .reverse();
