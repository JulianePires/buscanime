# Footer

> Chunk de retrieval. Fonte: Figma `3398:729`. Referência: `../references/footer.png`. Caso de uso: UC01.

| Propriedade | Valor                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| Altura      | 54 px, largura total                                                       |
| Fundo       | `primary`                                                                  |
| Logo        | `public/brand/logo.svg` escalado para 139 × 18 (fonte de 24 px)            |
| Legenda     | "TODOS OS DIREITOS RESERVADOS", Mulish Regular 10, `white`, abaixo do logo |
| Alinhamento | Bloco centralizado, padding-top 10                                         |

## Implementação

- `<footer>` (contentinfo) com o logo como `img` decorativo (`alt=""`) e o nome "Buscanime" em texto acessível, mais a legenda em `<p>` (texto real, não imagem).
