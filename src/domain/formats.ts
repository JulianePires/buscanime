import type { AnimeFormat } from "./anime";

export interface FormatOption {
  label: string;
  /** `null` é "All Formats": sem filtro de formato. */
  value: AnimeFormat | null;
}

export const FORMAT_OPTIONS: readonly FormatOption[] = [
  { label: "All Formats", value: null },
  { label: "TV Show", value: "TV" },
  { label: "Movie", value: "MOVIE" },
  { label: "TV Short", value: "TV_SHORT" },
  { label: "Special", value: "SPECIAL" },
  { label: "OVA", value: "OVA" },
  { label: "ONA", value: "ONA" },
  { label: "Music", value: "MUSIC" },
];

export function formatLabel(format: AnimeFormat) {
  return FORMAT_OPTIONS.find((option) => option.value === format)?.label ?? format;
}
