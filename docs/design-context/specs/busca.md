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
- Digitar não busca: sem debounce, só o submit ("Buscar" ou Enter) dispara a busca (UC09). O debounce do UC05 tirava a função do botão.
- O termo aplicado fica no query param `q` (UC09); voltar/avançar do navegador reescreve o campo com o termo daquela entrada.
- Foco visível: borda `primary`.
