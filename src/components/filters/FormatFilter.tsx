import type { AnimeFormat } from "../../domain/anime";
import { FORMAT_OPTIONS } from "../../domain/formats";

interface FormatFilterProps {
  selected: readonly AnimeFormat[];
  onToggle: (format: AnimeFormat) => void;
  /** "All Formats": remove o filtro de formato. */
  onClear: () => void;
}

/**
 * Linha de filtros do Figma (specs/filtros.md). Seleção múltipla com `aria-pressed`; "All Formats"
 * fica pressionado quando nada está selecionado. O fieldset dá o papel "group" com o nome da
 * legend; `min-w-0` desfaz o min-content padrão dele, que impediria a quebra de linha no mobile.
 * Todos os botões têm borda (no ativo, da cor do fundo) para manter a mesma altura; o padding
 * substitui as larguras fixas do Figma.
 */
export function FormatFilter({ selected, onToggle, onClear }: FormatFilterProps) {
  return (
    <fieldset className="flex min-w-0 flex-wrap justify-center gap-4.75">
      <legend className="sr-only">Formato</legend>
      {FORMAT_OPTIONS.map(({ label, value }) => (
        <button
          key={label}
          type="button"
          aria-pressed={value === null ? selected.length === 0 : selected.includes(value)}
          onClick={() => (value === null ? onClear() : onToggle(value))}
          className="h-8 cursor-pointer whitespace-nowrap rounded-control border border-primary bg-white px-4.75 font-semibold text-primary text-sm transition-colors not-aria-pressed:hover:bg-primary-light-1/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 aria-pressed:bg-primary aria-pressed:text-white"
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}
