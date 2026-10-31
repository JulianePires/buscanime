interface EmptyStateProps {
  term?: string;
}

export function EmptyState({ term }: EmptyStateProps) {
  return (
    <p role="status" className="py-12 text-center text-primary">
      {term ? `Nenhum anime encontrado para "${term}"` : "Nenhum anime encontrado."}
    </p>
  );
}
