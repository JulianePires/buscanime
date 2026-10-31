import { useEffect, useEffectEvent } from "react";
import { PAGE_SIZE_MEDIA_QUERIES, pageSizeForWidth } from "../../domain/page-size";

/** Tamanho da página para a largura atual da janela. */
export function currentPageSize() {
  return pageSizeForWidth(window.innerWidth);
}

/**
 * Avisa quando a largura da janela cruza uma faixa de tamanho de página. Usa matchMedia em vez
 * de "resize": o evento só dispara na troca de faixa, não a cada pixel.
 */
export function useViewportPageSize(onChange: (perPage: number) => void) {
  const notify = useEffectEvent(() => onChange(currentPageSize()));

  useEffect(() => {
    const queries = PAGE_SIZE_MEDIA_QUERIES.map((media) => window.matchMedia(media));
    for (const query of queries) query.addEventListener("change", notify);
    return () => {
      for (const query of queries) query.removeEventListener("change", notify);
    };
  }, []);
}
