# Ver mais

> Chunk de retrieval. Fonte: Figma `3396:75`. Referência: `../references/ver-mais.png`. Caso de uso: UC06.

| Propriedade | Valor                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Dimensões   | Largura total do conteúdo (até 1316), altura 48                              |
| Fundo       | `warning` (#FFB800), raio 8                                                  |
| Conteúdo    | Ícone `public/icons/add.svg` (30 × 24) + "Ver mais", gap ≈ 12, centralizados |
| Texto       | Mulish **SemiBold 20**, `white`                                              |

## Implementação

- `<button type="button">` com `<img src="/icons/add.svg" alt="" width="30" height="24">`; o nome acessível vem do texto.
- Estado de carregamento (não desenhado): manter o botão, `aria-busy="true"`, desabilitado e texto "Carregando...".
- Sem próxima página (`pageInfo.hasNextPage === false`): esconder o botão.
- Contraste: branco sobre #FFB800 tem razão ≈ 1,7:1 (abaixo do AA). Registrar como divergência de acessibilidade e decidir na revisão (ex.: texto `primary`, ≈ 4,6:1).
