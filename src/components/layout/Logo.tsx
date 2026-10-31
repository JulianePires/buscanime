interface LogoProps {
  className?: string;
}

/** Logo do Figma em SVG (texto em contorno); decorativo, o nome acessível fica no contêiner. */
export function Logo({ className }: LogoProps) {
  return <img src="/brand/logo.svg" alt="" width={231} height={29} className={className} />;
}
