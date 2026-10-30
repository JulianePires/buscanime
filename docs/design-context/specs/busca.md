# Busca por texto

> Chunk de retrieval. Fonte: Figma `3406:322`. Referência: `../references/busca.png`. Caso de uso: UC05.

| Elemento | Propriedades                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Campo    | Altura 38, fundo `white`, borda 1 px `gray-light-1`, raio 4, padding-left 10, Mulish Regular 14, placeholder `gray` "Digite algo aqui..." |
| Botão    | "Buscar", 86 × 38, fundo `primary`, texto `white` Mulish SemiBold 14, raio 4                                                              |
| Conjunto | Largura máxima 1012, gap de 10 px, campo ocupa o espaço restante                                                                          |

## Implementação

- `form role="search"` com `label` visualmente oculto ("Buscar anime") ligado ao `input type="search"`.
- O submit do formulário dispara a busca (`search` do AniList); Enter também submete.
- Foco visível: borda `primary`.
