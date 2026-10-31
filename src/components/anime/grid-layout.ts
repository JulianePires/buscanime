/**
 * Grade de cards (specs/layout.md): 4 colunas de 317 px em 1316 px de conteúdo, gaps 16 × 21;
 * abaixo disso, colunas de no mínimo 280 px. Compartilhada pela lista e pelo esqueleto de
 * carregamento, que ocupam o mesmo espaço (sem CLS).
 */
export const ANIME_GRID_CLASS_NAME =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-x-4 gap-y-5.25";
