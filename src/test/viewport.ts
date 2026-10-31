import { act } from "@testing-library/react";

/** Largura padrão dos testes: desktop, como o frame do Figma (o jsdom começa em 1024). */
export const DESKTOP_WIDTH = 1280;

interface FakeMediaQueryList extends EventTarget {
  media: string;
  matches: boolean;
}

const lists = new Set<FakeMediaQueryList>();

function evaluate(media: string, width: number) {
  const min = /min-width:\s*(\d+)px/.exec(media);
  const max = /max-width:\s*(\d+)px/.exec(media);
  return (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]));
}

/**
 * O jsdom não implementa o matchMedia. Polyfill com min-width/max-width calculados sobre o
 * innerWidth; `resizeViewport` dispara "change" só nas listas que mudaram, como o navegador.
 */
export function installViewport() {
  window.matchMedia = (media: string) => {
    const list = Object.assign(new EventTarget(), {
      media,
      matches: evaluate(media, window.innerWidth),
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
    });
    lists.add(list);
    return list as unknown as MediaQueryList;
  };
}

export function resetViewport() {
  lists.clear();
  window.innerWidth = DESKTOP_WIDTH;
}

/** Simula o redimensionamento da janela: troca o innerWidth e notifica as media queries. */
export function resizeViewport(width: number) {
  // biome-ignore lint/suspicious/useAwait: o act assíncrono agenda a retomada do Suspense
  return act(async () => {
    window.innerWidth = width;
    for (const list of lists) {
      const matches = evaluate(list.media, width);
      if (matches === list.matches) continue;
      list.matches = matches;
      list.dispatchEvent(new Event("change"));
    }
  });
}
