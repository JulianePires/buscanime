# Header

> Chunk de retrieval. Fonte: Figma `3398:598`. Referência: `../references/header.png`. Caso de uso: UC01.

| Propriedade  | Valor                                                        |
| ------------ | ------------------------------------------------------------ |
| Altura       | 68 px, largura total                                         |
| Fundo        | `primary` (#6324C6)                                          |
| Logo         | `public/brand/logo.svg` (231 × 29), centralizado             |
| Logo (texto) | "BUSC" `white` + "ANIME" `warning`, Mulish **Regular 40 px** |

## Implementação

- O logo é texto convertido em contorno no Figma; usar o SVG para fidelidade sem depender do carregamento da fonte.
- Marcação: `<a href="/" aria-label="Buscanime"><img src="/brand/logo.svg" alt="" width="231" height="29"></a>` dentro de `nav[aria-label="Navegação principal"]`. Não alterar `width`/`height` do SVG.
- Correção em relação ao `DESIGN.md` anterior: o logo não usa `H3/Bold`; é Mulish Regular 40.
