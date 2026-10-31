import type { AnimeStatus } from "./anime";

// Situação de lançamento do AniList (MediaStatus) em português, para o detalhe (UC03).

const STATUS_LABELS: Record<AnimeStatus, string> = {
  FINISHED: "Finalizado",
  RELEASING: "Em exibição",
  NOT_YET_RELEASED: "Não lançado",
  CANCELLED: "Cancelado",
  HIATUS: "Em hiato",
};

export function statusLabel(status: AnimeStatus) {
  return STATUS_LABELS[status];
}
