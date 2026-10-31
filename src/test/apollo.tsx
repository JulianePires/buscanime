import { act, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { CatalogProvider } from "../features/catalog/CatalogProvider";
import { createApolloClient } from "../services/anilist/apollo-client";

/** Em JSON: o MSW não lê o corpo em formulário (coberto em apollo-client.test.ts). */
export function createTestApolloClient() {
  return createApolloClient({ logErrors: false, formEncoded: false });
}

/** Assíncrono: no React 19, o que suspende num `act` síncrono não é retomado depois. */
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
