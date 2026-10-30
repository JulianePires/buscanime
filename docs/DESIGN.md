# Design

Referência visual extraída do [Figma do desafio Winnin](https://www.figma.com/design/uHjhK532Aq0D6L4teYX6bz/INSTITUCIONAL----DesafioWinnin--Copy-?node-id=0-1&t=nSRYqbMWXssxQlbl-1), frame `Desktop - 2` (1366 × 1457).

## Estrutura da página

| Área     | Conteúdo                                                                                                      | Caso de uso |
| -------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| Header   | Faixa roxa (68 px) com o logotipo `BUSCANIME` centralizado ("BUSC" em branco, "ANIME" em amarelo).            | UC01        |
| Filtros  | Botões de formato: All Formats, TV Show, Movie, TV Short, Special, OVA, ONA e Music. O ativo fica preenchido. | UC04        |
| Busca    | Campo de texto ("Digite algo aqui...") e botão "Buscar".                                                      | UC05        |
| Cards    | Grade de 4 colunas (cards de 317 × 270 px) com imagem de capa, título, gêneros e nota em percentual.          | UC02, UC03  |
| Ver mais | Botão amarelo de largura total com ícone `+` para carregar mais animes.                                       | UC06        |
| Footer   | Faixa roxa com o logotipo e "TODOS OS DIREITOS RESERVADOS".                                                   | UC01        |

## Tokens

### Cores

| Token                    | Valor     | Uso observado                                    |
| ------------------------ | --------- | ------------------------------------------------ |
| `Primary/Primary`        | `#6324C6` | Header, footer, filtro ativo, botão "Buscar".    |
| `Primary/Primary-Light1` | `#774DC5` | Tags de gênero nos cards.                        |
| `White`                  | `#FFFFFF` | Fundo da página, textos sobre cores escuras.     |
| `Gray/Light1`            | `#C4CAD4` | Bordas.                                          |
| `Gray/Light2`            | `#E2E5E9` | Fundos e divisores suaves.                       |
| `Gray/Gray`              | `#A7B0BE` | Placeholder e textos secundários.                |
| `Feedback/Success`       | `#01ADA6` | Nota alta (ex.: 80% a 87%).                      |
| `Feedback/Warning`       | `#FFB800` | Nota intermediária (ex.: 70% a 79%), "Ver mais". |
| `Feedback/Danger`        | `#E92151` | Nota baixa (ex.: 48%).                           |

### Tipografia

Família **Mulish**.

| Token         | Peso           | Tamanho | Uso observado        |
| ------------- | -------------- | ------- | -------------------- |
| `H3/Bold`     | 700 (Bold)     | 24 px   | Logotipo e destaques |
| `H4/Semibold` | 600 (SemiBold) | 20 px   | Títulos dos cards    |

## Observações

- Os formatos dos filtros correspondem ao enum `MediaFormat` da [API GraphQL do AniList](https://docs.anilist.co/) (`TV`, `TV_SHORT`, `MOVIE`, `SPECIAL`, `OVA`, `ONA`, `MUSIC`), candidata a fonte de dados.
- O design mostra só o desktop; o layout responsivo (RF08) deve ser derivado da grade de cards.
- O design usa um botão "Ver mais", enquanto o UC06 prevê scroll infinito; o comportamento final deve ser confirmado.
- As faixas de cor da nota foram inferidas dos exemplos do design e precisam de limites definidos.
