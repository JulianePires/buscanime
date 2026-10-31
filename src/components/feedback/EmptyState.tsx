interface EmptyStateProps {
  /** Termo pesquisado (UC05): a mensagem diz o que não foi encontrado. */
  term?: string;
}

export function EmptyState({ term }: EmptyStateProps) {
  return (
    <p role="status" className="py-12 text-center text-primary">
      {term ? `Nenhum anime encontrado para "${term}"` : "Nenhum anime encontrado."}
    </p>
  );
}
