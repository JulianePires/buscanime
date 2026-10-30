# Card de anime

> Chunk de retrieval. Fonte: Figma `3396:323` (componente "Card", 12 instâncias). Referência: `../references/card.png`. Dados de exemplo: `../fixtures/figma-cards.json`. Casos de uso: UC02, UC03.

## Anatomia

| Camada    | Propriedades                                                                                                  | Dado do AniList         |
| --------- | ------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Container | 317 × 270 (proporção ≈ 1,174), raio 8, `overflow: hidden`                                                     | —                       |
| Capa      | Imagem de fundo `object-fit: cover`                                                                           | `coverImage.extraLarge` |
| Overlay   | `linear-gradient(180deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.17) 105%)` sobre a capa                              | —                       |
| Conteúdo  | Coluna em `left 28 / top 23`, largura 261, gap 11                                                             | —                       |
| Título    | Mulish **Bold 24**, `white`, quebra de linha livre (no Figma, até 3 linhas com reticências)                   | `title.romaji`          |
| Gêneros   | Chips em linha, gap 11; chip: fundo `primary-light-1`, texto `gray-light-2` Regular 12, padding 3 × 8, raio 4 | `genres` (até 3)        |
| Nota      | Chip no canto inferior direito (right 8, bottom 8), texto `gray-light-2` Regular 24, padding 3 × 8, raio 4    | `averageScore` + "%"    |

## Cor da nota

`< 50` → `danger`; `50–80` (inclusive) → `warning`; `> 80` → `success`. O Figma pinta 80% de verde; vale a regra (ver `figma-cards.json`, campo `expectedColor`).

## Implementação

- O card é um `button` (abre o detalhe, UC03) dentro de `li`, com nome acessível igual ao título.
- A capa vem da API: **não** commitar as capas do Figma (são arte de terceiros e mudam por anime). Usar `<img loading="lazy" decoding="async" alt="">` com `width`/`height` para evitar CLS.
- Nota ausente (`averageScore: null`): não renderizar o chip.
- Título: `line-clamp: 3` para reproduzir o truncamento do último card.
