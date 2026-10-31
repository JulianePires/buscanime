interface LogoProps {
  className?: string;
}

/** Decorativo: o nome acessível fica no contêiner. */
export function Logo({ className }: LogoProps) {
  return <img src="/brand/logo.svg" alt="" width={231} height={29} className={className} />;
}
