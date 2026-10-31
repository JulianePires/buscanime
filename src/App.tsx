import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";

function App() {
  return (
    <div className="flex flex-col gap-section">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content px-4 sm:px-gutter">
        <h1 className="sr-only">Busca de animes</h1>
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
