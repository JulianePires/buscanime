# Layout da página

> Chunk de retrieval. Fonte: Figma `3396:579` (Frame 1709). Referência: `../references/desktop-frame.png`.

## Estrutura vertical

Coluna centralizada com `gap` de **24 px** entre as seções, nesta ordem:

| Ordem | Seção    | Largura no desktop           | Altura | Spec                       |
| ----- | -------- | ---------------------------- | ------ | -------------------------- |
| 1     | Header   | 100% (1366)                  | 68     | [header.md](header.md)     |
| 2     | Filtros  | conteúdo (834), centralizado | 32     | [filtros.md](filtros.md)   |
| 3     | Busca    | até 1012, centralizada       | 38     | [busca.md](busca.md)       |
| 4     | Cards    | até 1316 (gutter de 25)      | fluida | [card.md](card.md)         |
| 5     | Ver mais | até 1316                     | 48     | [ver-mais.md](ver-mais.md) |
| 6     | Footer   | 100%                         | 54     | [footer.md](footer.md)     |

Fundo da página: `white`. Abaixo do footer o frame tem área branca vazia (o footer não é fixo).

**Sticky footer (UC07, não está no Figma):** a coluna da página tem no mínimo a altura da janela (`min-h-dvh`) e o `main` cresce (`flex-1`). Com conteúdo curto (carregando, vazio, erro ou janela alta), o footer encosta no fim da janela em vez de deixar a área vazia abaixo dele. Com conteúdo longo, ele segue o fluxo depois do "Ver mais". Nunca `position: fixed`.

**Modal aberto (UC07):** `html:has(dialog:modal)` recebe `overflow: hidden` e reserva a calha da barra (`scrollbar-gutter: stable`) só enquanto o modal está aberto, para a largura não mudar quando o scroll trava. Fora do modal a calha não é reservada: com barras sobrepostas ou ocultas, ela tiraria 15 px do conteúdo e, a 1366 px, a área útil deixaria de ter os 1316 px do Figma.

## Grade de cards

- Desktop (≥ 1316 px de conteúdo): **4 colunas** de 317 px, `column-gap` 16 px, `row-gap` 21 px.
- Derivação responsiva (RF08, não está no Figma): `grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr))`, mantendo os gaps e a proporção do card (317 × 270 ≈ 1,174).
- Gutter lateral: 25 px no desktop; 16 px abaixo de 640 px.

## Tradução para o projeto

- Não copiar posições absolutas do snapshot (`source/desktop-frame.figma.tsx.txt`): usar flex/grid.
- Landmarks: `header` (banner) → `nav`; filtros e busca dentro de `main` num `form role="search"`; cards em `ul`/`li`; `footer` (contentinfo).
