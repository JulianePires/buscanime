# Use cases

## Casos de uso

| Código | Ator      | Objetivo                                 |
| ------ | --------- | ---------------------------------------- |
| UC01   | Visitante | Visualizar estrutura da página.          |
| UC02   | Visitante | Visualizar listagem de animes.           |
| UC03   | Visitante | Visualizar detalhe do anime listado.     |
| UC04   | Visitante | Filtrar lista por um ou mais formatos.   |
| UC05   | Visitante | Filtrar lista por busca de texto.        |
| UC06   | Visitante | Carregar mais animes pelo "Ver mais".    |
| UC07   | Visitante | Usar a página com layout estável.        |
| UC08   | Visitante | Carregar o detalhe do anime sob demanda. |

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

```gherkin
Dado que um anime listado possui nota média
Quando o card desse anime for exibido
Então a nota deve aparecer em percentual
E deve usar a cor de perigo se for menor que 50
E deve usar a cor de alerta se estiver entre 50 e 80, inclusive
E deve usar a cor de sucesso se for maior que 80
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

### UC06 — Carregar mais animes pelo "Ver mais"

```gherkin
Dado que a primeira página de animes foi carregada
Quando o visitante acionar o botão "Ver mais" ao final da listagem
Então o sistema deve carregar a próxima página sem recarregar a tela
E deve manter os animes já exibidos
```

### UC07 — Usar a página com layout estável

```gherkin
Dado que o conteúdo da página é menor que a altura da janela
Quando a página for exibida
Então o rodapé deve ficar encostado no final da janela
```

```gherkin
Dado que o conteúdo da página é maior que a altura da janela
Quando o visitante rolar até o fim
Então o rodapé deve aparecer depois do conteúdo, sem sobrepô-lo
```

```gherkin
Dado que o modal de detalhe está aberto
Quando o visitante clicar no overlay, fora do conteúdo do modal
Então o modal deve fechar
E o foco deve voltar para o card selecionado
```

```gherkin
Dado que o modal de detalhe está aberto
Quando o visitante clicar dentro do conteúdo do modal
Então o modal deve continuar aberto
```

```gherkin
Dado que o modal de detalhe está aberto
Quando o visitante tentar rolar a página
Então a página de fundo não deve rolar
E ao fechar o modal a rolagem deve voltar a funcionar na mesma posição
```

### UC08 — Carregar o detalhe do anime sob demanda

Decisão de arquitetura no [ADR-004](adr/ADR-004-consulta-propria-para-o-detalhe.md): a consulta do modal é separada da consulta da listagem.

```gherkin
Dado que a listagem de animes foi carregada
Quando a consulta da listagem for enviada
Então ela deve pedir apenas os campos exibidos no card
```

```gherkin
Dado que a listagem contém um anime
Quando o visitante abrir o detalhe desse anime
Então o modal deve abrir imediatamente com o título, a capa, os gêneros e a nota do card
E os dados complementares devem ser buscados em uma consulta própria pelo id do anime
E um estado de carregamento deve ocupar o lugar dos dados complementares até a resposta chegar
```

```gherkin
Dado que o detalhe de um anime já foi aberto
Quando o visitante fechar e abrir de novo o detalhe do mesmo anime
Então os dados complementares devem aparecer sem nova consulta
```

```gherkin
Dado que a consulta do detalhe falhou
Quando o modal for exibido
Então deve mostrar uma mensagem de erro com a opção "Tentar novamente" dentro do modal
E a listagem deve continuar visível e inalterada
E ao acionar "Tentar novamente" a consulta do detalhe deve ser refeita
```

## Estratégia TDD

Cada caso de uso deve ser implementado em ciclos Red, Green e Refactor:

1. Criar um teste Vitest/Testing Library para o comportamento esperado.
2. Implementar a menor mudança capaz de fazer o teste passar.
3. Refatorar mantendo os testes verdes.
4. Cobrir o fluxo completo no Playwright quando houver interação de navegador.

Mapeamento inicial:

| Caso | Teste unitário/integrado                                     | Teste e2e                |
| ---- | ------------------------------------------------------------ | ------------------------ |
| UC01 | Renderização da estrutura e títulos                          | Abertura da página       |
| UC02 | Renderização de itens, estado vazio e cor da nota por faixa  | Listagem visível         |
| UC03 | Seleção e conteúdo do detalhe                                | Abertura do detalhe      |
| UC04 | Estado dos formatos selecionados                             | Resultado filtrado       |
| UC05 | Entrada de busca e resultados                                | Busca por texto          |
| UC06 | Botão "Ver mais" e carregamento                              | Clique e novos itens     |
| UC07 | Clique no overlay e dentro do modal                          | Rodapé, overlay e scroll |
| UC08 | Campos das consultas, facade, carregamento e erro do detalhe | Requisições do detalhe   |
