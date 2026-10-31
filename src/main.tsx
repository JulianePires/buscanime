import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/mulish";
import "./index.css";
import App from "./App.tsx";
import { CatalogProvider } from "./features/catalog/CatalogProvider.tsx";
import { createApolloClient } from "./services/anilist/apollo-client.ts";

const client = createApolloClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CatalogProvider client={client}>
      <App />
    </CatalogProvider>
  </StrictMode>,
);
