import { type FormEvent, useEffect, useRef } from "react";

export const SEARCH_DEBOUNCE_MS = 400;

interface SearchBarProps {
  /** O campo não é controlado: só vale na montagem. */
  defaultValue?: string;
  onSearch: (term: string) => void;
}

/** Sem `<form action>`: o React 19 reseta os campos não controlados depois da action. */
export function SearchBar({ defaultValue, onSearch }: SearchBarProps) {
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pending.current), []);

  function scheduleSearch(term: string) {
    clearTimeout(pending.current);
    pending.current = setTimeout(() => onSearch(term), SEARCH_DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(pending.current);
    const term = new FormData(event.currentTarget).get("search");
    onSearch(typeof term === "string" ? term : "");
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: o aria-query do Testing Library não mapeia <search>
    <form
      role="search"
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-search gap-2.5"
    >
      <label htmlFor="anime-search" className="sr-only">
        Buscar anime
      </label>
      <input
        id="anime-search"
        name="search"
        type="search"
        defaultValue={defaultValue}
        onChange={(event) => scheduleSearch(event.currentTarget.value)}
        placeholder="Digite algo aqui..."
        autoComplete="off"
        className="h-9.5 min-w-0 flex-1 rounded-control border border-gray-light-1 bg-white pl-2.5 text-sm outline-none transition-colors placeholder:text-gray focus:border-primary"
      />
      <button
        type="submit"
        className="h-9.5 w-21.5 shrink-0 cursor-pointer rounded-control bg-primary font-semibold text-sm text-white transition-colors hover:bg-primary-light-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        Buscar
      </button>
    </form>
  );
}
