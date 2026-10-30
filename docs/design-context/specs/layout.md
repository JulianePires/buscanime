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

## Grade de cards

- Desktop (≥ 1316 px de conteúdo): **4 colunas** de 317 px, `column-gap` 16 px, `row-gap` 21 px.
- Derivação responsiva (RF08, não está no Figma): `grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr))`, mantendo os gaps e a proporção do card (317 × 270 ≈ 1,174).
- Gutter lateral: 25 px no desktop; 16 px abaixo de 640 px.

## Tradução para o projeto

- Não copiar posições absolutas do snapshot (`source/desktop-frame.figma.tsx.txt`): usar flex/grid.
- Landmarks: `header` (banner) → `nav`; filtros e busca dentro de `main` num `form role="search"`; cards em `ul`/`li`; `footer` (contentinfo).
