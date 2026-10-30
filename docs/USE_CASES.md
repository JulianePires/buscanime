# Use cases

## Casos de uso

| Código | Ator      | Objetivo                                             |
| ------ | --------- | ---------------------------------------------------- |
| UC01   | Visitante | Visualizar estrutura da página.                      |
| UC02   | Visitante | Visualizar listagem de animes.                       |
| UC03   | Visitante | Visualizar detalhe do anime listado.                 |
| UC04   | Visitante | Filtrar lista por um ou mais formatos.               |
| UC05   | Visitante | Filtrar lista por busca de texto.                    |
| UC06   | Visitante | Alterar tamanho de paginação usando scroll infinito. |

## Critérios BDD

### UC01 — Visualizar estrutura da página

```gherkin
Dado que o visitante acessou a aplicação
Quando a página terminar de carregar
Então deve visualizar a navegação, o título principal e a área de conteúdo
```

### UC02 — Visualizar listagem de animes

```gherkin
Dado que existem animes disponíveis
Quando o visitante acessar a área de listagem
Então deve visualizar os animes em cards ou itens identificáveis
```

### UC03 — Visualizar detalhe do anime listado

```gherkin
Dado que a listagem contém um anime
Quando o visitante selecionar esse anime
Então deve visualizar seus dados detalhados em um modal
```

### UC04 — Filtrar lista por um ou mais formatos

```gherkin
Dado que existem animes de formatos diferentes
Quando o visitante selecionar um ou mais formatos
Então a listagem deve exibir somente os animes compatíveis
```

### UC05 — Filtrar lista por busca de texto

```gherkin
Dado que existem animes cadastrados
Quando o visitante informar um texto de busca
Então a listagem deve exibir os animes correspondentes ao texto
```

### UC06 — Alterar tamanho de paginação usando scroll infinito

```gherkin
Dado que a primeira página de animes foi carregada
Quando o visitante alcançar o final da listagem
Então o sistema deve carregar a próxima página sem recarregar a tela
```

## Estratégia TDD

Cada caso de uso deve ser implementado em ciclos Red, Green e Refactor:

1. Criar um teste Vitest/Testing Library para o comportamento esperado.
2. Implementar a menor mudança capaz de fazer o teste passar.
3. Refatorar mantendo os testes verdes.
4. Cobrir o fluxo completo no Playwright quando houver interação de navegador.

Mapeamento inicial:

| Caso | Teste unitário/integrado             | Teste e2e            |
| ---- | ------------------------------------ | -------------------- |
| UC01 | Renderização da estrutura e títulos  | Abertura da página   |
| UC02 | Renderização de itens e estado vazio | Listagem visível     |
| UC03 | Seleção e conteúdo do detalhe        | Abertura do detalhe  |
| UC04 | Estado dos formatos selecionados     | Resultado filtrado   |
| UC05 | Entrada de busca e resultados        | Busca por texto      |
| UC06 | Controle de página e carregamento    | Scroll e novos itens |
