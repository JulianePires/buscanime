import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="h-header bg-primary">
      <nav aria-label="Navegação principal" className="flex h-full items-center justify-center">
        <a href="/" aria-label="Buscanime">
          <Logo />
        </a>
      </nav>
    </header>
  );
}
