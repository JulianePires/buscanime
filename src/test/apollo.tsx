import { act, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { CatalogProvider } from "../features/catalog/CatalogProvider";
import { createApolloClient } from "../services/anilist/apollo-client";

/** Client real (links + typePolicies) com cache novo e sem logs; o MSW responde pela rede. */
export function createTestApolloClient() {
  return createApolloClient({ logErrors: false });
}

/**
 * Renderiza dentro do CatalogProvider. É assíncrono de propósito: no React 19, um componente
 * que suspende durante o `act` síncrono do `render` não é retomado depois; com
 * `await act(async () => ...)` o React agenda a retomada e os `findBy*` funcionam.
 */
export async function renderWithCatalog(ui: ReactNode, client = createTestApolloClient()) {
  let result: ReturnType<typeof render> | undefined;
  // biome-ignore lint/suspicious/useAwait: o act assíncrono é o que agenda a retomada do Suspense
  await act(async () => {
    result = render(<CatalogProvider client={client}>{ui}</CatalogProvider>);
  });
  return { client, ...(result as ReturnType<typeof render>) };
}

/** Clique que pode suspender (troca de filtros, "Ver mais", "Tentar novamente"). */
export function clickAndWait(element: Element) {
  // biome-ignore lint/suspicious/useAwait: idem ao renderWithCatalog
  return act(async () => {
    fireEvent.click(element);
  });
}
