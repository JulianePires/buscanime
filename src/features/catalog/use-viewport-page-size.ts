import { useEffect, useEffectEvent } from "react";
import { PAGE_SIZE_MEDIA_QUERIES, pageSizeForWidth } from "../../domain/page-size";

export function currentPageSize() {
  return pageSizeForWidth(window.innerWidth);
}

/** matchMedia em vez de "resize": só dispara na troca de faixa, não a cada pixel. */
export function useViewportPageSize(onChange: (perPage: number) => void) {
  const notify = useEffectEvent(() => onChange(currentPageSize()));

  useEffect(() => {
    const queries = PAGE_SIZE_MEDIA_QUERIES.map((media) => window.matchMedia(media));
    for (const query of queries) query.addEventListener("change", notify);
    // A largura pode ter mudado de faixa entre o primeiro render e a inscrição
    notify();
    return () => {
      for (const query of queries) query.removeEventListener("change", notify);
    };
  }, []);
}
