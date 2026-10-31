import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="flex h-footer flex-col items-center gap-1.5 bg-primary pt-2.5 text-white">
      {/* Mesmo SVG do cabeçalho na escala da fonte de 24 px (231 × 0,6 ≈ 139) */}
      <Logo className="h-auto w-[139px]" />
      <span className="sr-only">Buscanime</span>
      <p className="text-caption">TODOS OS DIREITOS RESERVADOS</p>
    </footer>
  );
}
