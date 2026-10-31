# Prompts de implementação

Um prompt por caso de uso, pronto para colar no Claude Code na raiz do repositório. Todos seguem o mesmo padrão para que o resultado seja previsível, revisável e fiel ao design.

| UC       | Prompt                                                                 | Branch                     |
| -------- | ---------------------------------------------------------------------- | -------------------------- |
| UC01     | [Estrutura da página](UC01-estrutura-da-pagina.md)                     | `feat/uc01-estrutura`      |
| SETUP-01 | [Apollo Client e GraphQL Codegen](SETUP-01-apollo-client-e-codegen.md) | `feat/setup-01-apollo`     |
| UC02     | [Listagem de animes](UC02-listagem-de-animes.md)                       | `feat/uc02-listagem`       |
| UC03     | [Detalhe do anime](UC03-detalhe-do-anime.md)                           | `feat/uc03-detalhe`        |
| UC04     | [Filtro por formato](UC04-filtro-por-formato.md)                       | `feat/uc04-filtro-formato` |
| UC05     | [Busca por texto](UC05-busca-por-texto.md)                             | `feat/uc05-busca-texto`    |
| UC06     | [Ver mais e tamanho da página](UC06-ver-mais-e-tamanho-da-pagina.md)   | `feat/uc06-ver-mais`       |

## Estrutura padrão

Cada prompt usa seções em tags XML, que delimitam instruções, contexto e formato de saída sem ambiguidade:

| Seção             | Função                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| `<papel>`         | Postura esperada (engenheiro frontend sênior trabalhando em TDD).                      |
| `<objetivo>`      | Resultado observável do UC, em uma frase.                                              |
| `<retrieval>`     | Arquivos exatos a ler **antes** de qualquer edição, na ordem de autoridade do ADR-001. |
| `<restricoes>`    | Stack, padrões de projeto e o que é proibido.                                          |
| `<criterios_bdd>` | Cenários Gherkin que viram testes com o mesmo texto.                                   |
| `<plano_tdd>`     | Lista ordenada de testes vermelhos; cada um libera a menor implementação possível.     |
| `<design>`        | Valores críticos de fidelidade já recuperados (evita reabrir o Figma).                 |
| `<arquivos>`      | Arquivos que devem existir ou mudar ao final.                                          |
| `<verificacao>`   | Comandos e checagens da Definition of Done.                                            |
| `<saida>`         | O que reportar: resumo, divergências, mensagem de commit e entrada do `AI_LOG.md`.     |

## Boas práticas aplicadas

- **Contexto antes da ação:** a etapa de retrieval vem primeiro e é obrigatória; o Figma ao vivo só é consultado se faltar informação.
- **Critérios verificáveis:** todo requisito do prompt é um teste ou um comando.
- **Escopo fechado:** cada prompt lista o que não fazer (anti-objetivos), evitando que a IA antecipe outros UCs.
- **Exemplos concretos:** valores de borda (nota 49, 50, 80, 81) e fixtures do design.
- **Saída estruturada:** o relatório final segue sempre o mesmo formato para alimentar `CHANGELOG.md` e `AI_LOG.md`.

## Como usar

1. Crie a branch indicada a partir da `main` atualizada.
2. Cole o prompt inteiro no Claude Code.
3. Revise os testes vermelhos antes de aprovar a implementação (ponto de controle humano).
4. Ao final, confira a seção `<saida>` e abra o PR.
