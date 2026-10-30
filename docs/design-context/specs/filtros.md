# Filtros por formato

> Chunk de retrieval. Fonte: Figma `3396:65`. Referência: `../references/filtros.png`. Caso de uso: UC04.

## Botões

Ordem: All Formats, TV Show, Movie, TV Short, Special, OVA, ONA, Music. Gap horizontal de 19 px; linha centralizada.

| Estado  | Fundo     | Borda          | Texto     |
| ------- | --------- | -------------- | --------- |
| Ativo   | `primary` | —              | `white`   |
| Inativo | `white`   | 1 px `primary` | `primary` |

- Altura 32 px, raio 4 px, Mulish **SemiBold 14**, padding horizontal ≈ 19–23 px (largura pelo conteúdo).
- Larguras no Figma: 119, 105, 76, 105, 88, 65, 67, 76 (resultado do padding; não fixar).

## Mapeamento para o AniList (`MediaFormat`)

| Rótulo      | Valor      |
| ----------- | ---------- |
| All Formats | sem filtro |
| TV Show     | `TV`       |
| Movie       | `MOVIE`    |
| TV Short    | `TV_SHORT` |
| Special     | `SPECIAL`  |
| OVA         | `OVA`      |
| ONA         | `ONA`      |
| Music       | `MUSIC`    |

## Implementação

- Seleção múltipla (UC04): botões com `aria-pressed`, agrupados em `role="group"` com rótulo "Formato". "All Formats" limpa a seleção e fica ativo quando nenhuma opção está marcada.
- Estados não desenhados (derivar dos tokens): `:hover` com fundo `primary-light-1` a 10%, `:focus-visible` com contorno de 2 px `primary` e offset de 2 px.
