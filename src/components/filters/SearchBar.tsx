import { type FormEvent, useEffect, useRef } from "react";

interface SearchBarProps {
  /** Termo aplicado. O campo não é controlado: só é reescrito quando o termo muda por fora. */
  term?: string;
  onSearch: (term: string) => void;
}

/**
 * A busca dispara só no submit ("Buscar" ou Enter), sem debounce da digitação: uma requisição
 * por intenção do visitante. Sem `<form action>`: o React 19 reseta os campos não controlados.
 */
export function SearchBar({ term, onSearch }: SearchBarProps) {
  const input = useRef<HTMLInputElement>(null);

  // Voltar/avançar do navegador (UC09) troca o termo; a mesma busca, só normalizada, não
  useEffect(() => {
    const field = input.current;
    if (field && field.value.trim() !== (term ?? "")) field.value = term ?? "";
  }, [term]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    onSearch(typeof value === "string" ? value : "");
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
        ref={input}
        id="anime-search"
        name="search"
        type="search"
        defaultValue={term}
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
