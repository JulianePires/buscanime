# AI Log

Registro do trabalho assistido por IA para a fundação e evolução da aplicação Buscanime.

## Ferramentas

- **ClaudeCode:** exploração do repositório, implementação dos arquivos de configuração, criação da estrutura inicial da interface, documentação e validação.
- **Vite:** servidor de desenvolvimento e bundling.
- **React + TypeScript:** composição da interface e segurança de tipos.
- **Tailwind CSS:** sistema de estilos utilitários integrado ao Vite.
- **ESLint + SonarJS:** identificação de erros e principais code smells.
- **Biome:** formatação e lint complementar.
- **Vitest + Testing Library:** testes rápidos de componentes.
- **Apollo Client 4 + GraphQL Codegen:** camada de dados com cache normalizado e tipos gerados do schema do AniList.
- **MSW 3:** mock do AniList na fronteira de rede nos testes de integração.
- **Playwright:** validação da experiência no navegador.
- **Commitlint + Husky + lint-staged:** padronização de mensagens e checagem dos arquivos antes do commit.
- **Lighthouse:** auditoria de performance, acessibilidade, boas práticas e SEO (executado com o Chromium do Playwright).
- **GitHub Actions + CodeQL + Dependency Review:** pipeline de CI em estágios e análise de segurança no GitHub.
- **Figma MCP:** leitura da estrutura do frame e dos tokens (cores e tipografia) a partir da cópia acessível do arquivo do desafio; exportação dos assets (`exportAsync` em SVG com texto em contorno), dos renders por seção (`get_screenshot`) e do código de referência (`get_design_context`) para a base de contexto local.

## Organização do trabalho

1. Inspecionar o template Vite existente e seus pontos de entrada.
2. Preservar a stack base React/TypeScript e instalar as ferramentas solicitadas.
3. Configurar scripts reproduzíveis no `package.json`.
4. Substituir a tela de exemplo por uma primeira dobra institucional baseada na direção do Figma.
5. Criar testes unitário e end-to-end para o fluxo inicial.
6. Documentar requisitos, casos de uso, arquitetura e decisões no README.
7. Validar com formatação, lint, testes e build.
8. Reorganizar a documentação por tipo, mantendo o README como índice.
9. Especificar UC01 a UC06 com critérios BDD e estratégia TDD.
10. Recuperar a estrutura a partir do checkpoint anterior do Claude Code, revisar contra o pedido e corrigir os gates quebrados.
11. Aplicar TDD em UC01: escrever os testes (vermelho), ajustar a página (verde) e validar e2e e Lighthouse.
12. Ler o Figma (estrutura e tokens) e documentar a referência visual em `docs/DESIGN.md`.
13. Adaptar o script de versão para pacote único em TDD e versionar o trabalho em uma branch própria.
14. Exportar os assets do Figma para `public/` e montar a base de contexto de design (`docs/design-context/`) para retrieval.
15. Registrar a decisão de RAG no ADR-001 e escrever o plano de implementação com um prompt documentado por caso de uso.
16. Montar o CI no GitHub Actions em estágios por custo (commits e versão → qualidade e segurança → testes → build → e2e e Lighthouse), com notas mínimas do Lighthouse definidas em TDD.
17. Trocar o TanStack Query pelo Apollo Client 4 (SETUP-01) em TDD: testes de cache, client, mappers, reducer, facade, Error Boundary e fronteira de lint antes da implementação; medir o bundle e registrar o ADR-003.

## Verificação do trabalho

O comando `pnpm validate` concentra a validação local:
- `pnpm format:check`: garante que o Biome não detecta divergências.
- `pnpm lint`: executa ESLint e regras de code smells.
- `pnpm test`: executa os testes unitários.
- `pnpm build`: confirma a compilação TypeScript e o build de produção.
- `pnpm test:e2e`: valida a página compilada no Chromium.
- `pnpm lighthouse:ci`: gera `reports/lighthouse.report.html` e `.json` e falha abaixo das notas mínimas.

No GitHub, o workflow `.github/workflows/ci.yml` repete essas verificações em PRs e na `main`, somando commits, versionamento e segurança.

Última verificação (30/10/2026, SETUP-01): `pnpm codegen`, `pnpm validate` verde (Biome, ESLint, 67 testes Vitest em 10 arquivos, build), `pnpm typecheck`, `pnpm test:e2e` com 1 teste aprovado, `pnpm audit --audit-level high` sem achados altos e Lighthouse com Performance 100, Acessibilidade 100, Boas práticas 100 e SEO 91.

## Correções realizadas

- Removido o conteúdo de demonstração padrão do Vite.
- Corrigida a ausência de uma estrutura de conteúdo institucional e de chamadas para ação.
- Adicionadas validações automatizadas para título, proposta principal e link de contato.
- Ignorados relatórios gerados e diretórios de ferramentas no lint.
- README reduzido a uma visão geral e índice dos documentos especializados.
- Requisitos, casos de uso, arquitetura e ferramentas separados em documentos próprios.
- Casos de uso atualizados para contemplar listagem, detalhe, filtros e paginação por scroll infinito.
- Arquivos do projeto haviam sido removidos do disco e do índice; foram recuperados do checkpoint do Claude Code (`refs/agents/.../turn/1`) sem sobrescrever arquivos existentes.
- Testes unitário e e2e esperavam textos da página institucional removida; reescritos para UC01 (navegação principal, cabeçalho e área principal).
- `pre-commit` chamava o lint-staged sem configuração; adicionada a configuração no `package.json`.
- Finais de linha CRLF quebravam o `biome ci`; adicionado `.gitattributes` com `eol=lf`.
- `lighthouse:ci` travava sem Chrome no sistema; criado `scripts/lighthouse.js` usando `CHROME_PATH` ou o Chromium do Playwright.
- `index.html` estava em inglês e com título institucional; ajustado para `pt-BR` e para a busca de animes.
- `scripts/bump-versions.js` dependia de `pnpm-workspace.yaml` e lançava erro sem a `main`; adaptado para o `package.json` da raiz, com aviso (sem erro) quando não há base de comparação.
- `$schema` do Biome alinhado à versão instalada do CLI (2.6.2) e override para permitir módulos Node nos arquivos de configuração.
- O Lighthouse só gerava o relatório, sem reprovar nada; passou a falhar abaixo das notas mínimas, condição para ter valor no CI.
- `scripts/lighthouse.js` chamava o CLI com `shell: true` (aviso DEP0190 do Node, argumentos sem escape); passou a executar o CLI direto pelo Node.
- Com só `perPage` na chave do `Page` (como o prompt SETUP-01 pedia), o `pageInfo` era compartilhado entre combinações de filtros; os filtros (`$search`, `$formats`, `$sort`) entraram no `keyArgs`, com teste.
- O "Tentar novamente" do Error Boundary não refazia a requisição: o Apollo devolvia a referência com erro guardada no suspense cache. A nova tentativa troca o `queryKey`.
- Componentes suspensos não voltavam a renderizar nos testes: no React 19, o `act` síncrono do `render` não agenda a retomada. `renderWithCatalog` e `clickAndWait` passaram a usar `act` assíncrono.
- O `near-operation-file-preset` trouxe `@graphql-tools/utils` 11 com duas vulnerabilidades _high_, que reprovariam o CI; um `pnpm.overrides` fixa a versão corrigida.

## Decisões

- **Paginação por "Ver mais":** definida como padrão na revisão, seguindo o design; RF06, UC06, README e arquitetura deixaram de citar scroll infinito.
- **Faixas da nota:** definidas na revisão: abaixo de 50 vermelho (`Feedback/Danger`), de 50 a 80 amarelo (`Feedback/Warning`), acima de 80 verde (`Feedback/Success`). Especificadas em BDD no UC02.
- **AniList como fonte de dados:** confirmada na revisão; formatos via `MediaFormat` e nota via `averageScore`.
- **React 19:** adotado pelas novas funcionalidades (`use` + `Suspense`, transições assíncronas, `useDeferredValue`, `useOptimistic`, `ref` como prop e metadados no componente), mapeadas aos casos de uso em `ARQUITETURA-E-FERRAMENTAS.md`.
- **React Compiler:** adotado para otimizar a renderização com memoização automática, evitando `useMemo`/`useCallback`/`React.memo` manuais e reduzindo re-renderizações da listagem.
- **Tailwind 4 via plugin oficial:** reduz configuração manual e mantém o CSS alinhado ao pipeline Vite.
- **Biome separado do ESLint:** Biome fica responsável por formato/imports e ESLint por regras semânticas e smells.
- **ESLint SonarJS:** cobre complexidade, duplicação e padrões de manutenção sem introduzir regras específicas de negócio.
- **Vitest com jsdom:** permite testar a composição React sem abrir um navegador.
- **Playwright com preview:** o e2e valida o artefato mais próximo da execução de produção.
- **Lighthouse sob demanda:** evita tornar o desenvolvimento local dependente de um navegador aberto.
- **README como índice:** evita duplicação e mantém cada tipo de definição em seu documento de domínio.
- **BDD e TDD documentados junto aos casos de uso:** conecta comportamento esperado com a estratégia de testes.
- **Testes por papel acessível:** os testes de UC01 consultam `banner`, `navigation` e `main`, reforçando o RNF01 sem depender de textos provisórios.
- **Code smells explícitos no ESLint:** limites de tamanho (`max-params`, `max-lines`, `max-lines-per-function`) e legibilidade (`eqeqeq`, `no-nested-ternary`) complementam o SonarJS.
- **README com seções-resumo:** cada seção (RF, RNF, casos de uso, arquitetura) resume o tema e aponta para o documento detalhado em `docs/`.
- **Commits de até 30 arquivos:** a entrega foi dividida em três commits para respeitar `scripts/check-commit-size.js`.
- **Versionamento de pacote único:** o script de bump lê só o `package.json` da raiz; a propagação entre pacotes do workspace foi removida. As funções puras (`commitLevel`, `bump`, `targetVersion`, `isVersionOnlyDiff`) são exportadas e testadas, e a CLI só executa quando chamada diretamente.
- **Branch própria sobre uma `main` inicial:** como o repositório não tinha commits, a `main` foi criada com um commit vazio para servir de base ao PR e ao cálculo de versão; o trabalho fica em `feat/estrutura-base`.
- **Design em documento próprio:** tokens e estrutura do Figma ficam em `docs/DESIGN.md`, com o README resumindo e apontando para ele.
- **Base de contexto de design (RAG):** o Figma foi convertido em uma base local versionada (`docs/design-context/`) com índice por UC, specs por seção, tokens, renders, fixtures e o código bruto como último recurso. A IA consulta essa base antes de cada implementação e só volta ao Figma se faltar informação. Retrieval determinístico por arquivo, sem embeddings, pelo volume pequeno. Detalhes no [ADR-001](adr/ADR-001-base-de-contexto-de-design-rag.md).
- **TanStack Query, sem shadcn e sem React Hook Form:** critério "a dependência entra quando apaga mais código do que traz". O Query substitui cache de promises (exigido pelo `use`), acúmulo de páginas, abort e retry; o AniList usa `POST`, então o cache HTTP do navegador não ajuda. Filtros seguem num reducer puro. Componentes ficam sobre elementos nativos (`<dialog>`, `<select>`) e a busca usa input não controlado com `FormData` no `onSubmit` (o `<form action>` do React 19 resetaria o campo). Detalhes no [ADR-002](adr/ADR-002-dependencias-de-dados-ui-e-formularios.md).
- **Assets em SVG exportados do nó:** logo e ícone saíram do próprio Figma (`exportAsync`, texto em contorno), sem redesenho; o logo em SVG dispensa a fonte para manter a fidelidade.
- **Apollo Client 4 no lugar do TanStack Query:** decidido na revisão de 30/10/2026. Pesaram os tipos gerados do schema, o cache normalizado (o detalhe lê o `Media` da listagem) e a paginação declarativa; o custo de bundle (+63,6 KB gzip contra +9,9 KB) foi medido e registrado. Sem os dois juntos, para não manter dois caches. Detalhes no [ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md).
- **Capas fora do repositório:** as imagens dos cards são arte de terceiros e vêm do AniList em tempo de execução; aparecem apenas nos renders de referência.
- **CI em estágios por custo:** convenções de commit, tamanho e versão barram o pipeline antes de qualquer instalação de navegador; qualidade, `pnpm audit`/Dependency Review e CodeQL rodam em paralelo; e2e e Lighthouse usam o mesmo `dist` do build.
- **Notas mínimas do Lighthouse:** performance 90, acessibilidade 95 (RNF01), boas práticas 90 e SEO 90, abaixo das notas atuais (100/100/100/91) para tolerar a variação dos runners.
- **Segurança da pipeline:** Actions fixadas por SHA, permissões mínimas e título do PR em variável de ambiente (sem interpolação no shell).
- **`packageManager` e `engines`:** fixam pnpm 10.34.6 e Node 22.12+ para o CI e o ambiente local usarem as mesmas versões.
- **Prompts por caso de uso:** cada UC tem um prompt em `docs/prompts/` com retrieval obrigatório, restrições, cenários BDD, plano TDD, valores de design, arquivos, verificação e formato de saída.

## Ajustes da IA

- O layout inicial é uma interpretação estrutural do Figma, não uma cópia final de conteúdo ou identidade. Textos, imagens e contatos devem ser substituídos pelo material oficial.
- A configuração foi mantida modular para que a próxima etapa possa extrair componentes e conectar dados reais sem alterar os gates de qualidade.
- A descrição do README foi reescrita a partir do frame do Figma (header, filtros, busca, grade de cards, "Ver mais" e footer).
- As faixas de cor da nota e a relação dos formatos com a API do AniList, antes inferidas do design, foram confirmadas na revisão e documentadas em `docs/DESIGN.md`.
- Os conteúdos de RF, RNF e casos de uso ajustados manualmente (ver "Meus ajustes") foram preservados; só RF06 e UC06 mudaram de scroll infinito para "Ver mais", por solicitação na revisão, e o UC02 ganhou o cenário de cor da nota.
- No Figma, o card com 80% aparece verde, mas pela regra definida 80 é amarelo; a regra foi reconfirmada na revisão (abaixo de 50 vermelho, entre 50 e 80 amarelo, acima de 80 verde) e prevalece sobre o exemplo do design.
- A exportação corrigiu a tipografia documentada: o logotipo é Mulish Regular 40 px (não `H3/Bold`), `H3/Bold` é o título do card e `H4/Semibold` é o "Ver mais".
- O download direto das URLs de asset do Figma foi bloqueado pela rede da sessão; os SVGs foram obtidos pela API de plugin (`exportAsync`) e os PNGs pelo `get_screenshot`, com o mesmo resultado do original. A assinatura C2PA adicionada aos SVGs pela ferramenta foi removida para não pesar no bundle.
- Contraste abaixo do AA identificado no design ("Ver mais" e chip da nota) e levado para as decisões em aberto do plano, sem alteração unilateral.

## Pendências

- SEO do Lighthouse em 91: avaliar os itens apontados no relatório.
- Confirmar as decisões em aberto do plano: contraste do "Ver mais" e do chip da nota e o seletor de itens por página (RF07).
- Ativar no GitHub a proteção da `main` exigindo os checks do CI antes do merge.
- Avaliar um mínimo de cobertura no Vitest quando os UCs com lógica de domínio forem implementados.
- UC06: a facade deve expor `loadMoreError` (hoje um erro no `fetchMore` sobe para o Error Boundary).
- Acompanhar o bundle quando o UC02 passar a usar a facade (esperado perto de +64 KB gzip) e o Lighthouse de Performance.
- Revisar o `pnpm.overrides` de `@graphql-tools/utils` ao atualizar o GraphQL Codegen.

## Registro de alterações

### UC03: Visualizar detalhe do anime listado

- **Escopo:** campos do detalhe em `ANIME_PAGE` (`description(asHtml: false)`, `episodes`, `seasonYear`, `status`, `siteUrl`) + `pnpm codegen`; domínio (`Anime` ampliado, `formats.ts`, `status.ts`); `toAnime` com sinopse em texto puro; `AnimeDetailDialog`; botão no `AnimeCard`; seleção e volta do foco no `AnimeGrid`; polyfill de `<dialog>` no setup; e2e por teclado com mock compartilhado. Sem rota nova e sem biblioteca de modal.
- **Abordagem:** TDD na ordem do prompt: mappers → diálogo → integração (`renderWithCatalog` + msw contando chamadas) → e2e, cada camada vermelha antes da implementação. Os cenários Gherkin viram `describe` com o mesmo texto; Esc e "Fechar" rodam o mesmo cenário por `describe.each`.
- **Decisões derivadas (o modal não está no Figma):** superfície `white`, raio `card` (8), padding 24, até 720 px, backdrop `black` a 60%; título H3/Bold 24 em `primary`; "Fechar" como botão de texto no estilo do filtro inativo (borda e texto `primary`, raio `control`, SemiBold 14, foco 2 px `primary`); rótulos dos dados em `primary` e valores em `black` (token já usado na nota; os cinzas não passam no contraste sobre branco); capa 230 × 325 (proporção do AniList) com `alt=""`; `GenreChip` e `ScoreBadge` reaproveitados. O card continua `article` com um botão transparente por cima (nome = título), para manter os testes e o heading do UC02.
- **Foco:** o `AnimeGrid` guarda o botão acionado e o foca ao fechar, em vez de depender do navegador (o Safari não foca botões no clique, então o "elemento previamente focado" seria o `body`).
- **Sinopse:** o AniList manda `<br>`, `<i>` e entidades mesmo com `asHtml: false`. O mapper troca `<br>` por quebra de linha, remove as demais tags, decodifica as entidades e a UI usa `whitespace-pre-line` (sem `dangerouslySetInnerHTML`). A regex de tags exclui `<` da classe (`<[^<>]*>`) para ficar linear (SonarJS `super-linear-regex`).
- **Verificação:** `pnpm lint`, `pnpm test` (162), `pnpm typecheck`, `pnpm build`, `pnpm test:e2e` (7). `pnpm lighthouse:ci`: acessibilidade 100 nas 4 rodadas (o commit do UC02 medido no mesmo momento deu 95); performance de 82 a 86, abaixo do mínimo de 90, mas o UC02 no mesmo momento deu de 81 a 89: variação da rede ao vivo (AniList e capas), não regressão do UC03.
- **Commits:** `feat: open anime detail in accessible dialog`, `test: verify anime detail by keyboard end to end`.
- **PR sugerido:** `feat: show anime detail in accessible dialog (uc03)`.

### UC02: Visualizar listagem de animes

- **Escopo:** `src/domain/score.ts` (faixas da nota como tabela); `AnimeCard`, `AnimeGrid`, `ScoreBadge`, `GenreChip` e `grid-layout.ts`; `LoadingState` (esqueleto na mesma grade) e `EmptyState`; `CatalogResults` ligando a facade `useCatalog()` à apresentação; `App` com `ErrorBoundary` + `Suspense`; estilo do `ErrorBoundary`; token `--color-black`; preconnect para o AniList; e2e com `page.route`. Sem filtros, busca, detalhe ou "Ver mais".
- **Abordagem:** TDD em camadas (domínio → apresentação → integração → e2e), com cada teste vermelho antes da implementação. A regra da nota é testada com os 12 cards de `figma-cards.json` (`expectedColor`). Na integração, o msw responde ao `AnimePage` e `renderWithCatalog`/`clickAndWait` cuidam do Suspense. Os critérios BDD viram `describe` com o mesmo texto.
- **Divergências do Figma:** nota 80 em amarelo (regra de negócio; o Figma pinta de verde). Texto da nota escuro sobre `warning`/`success`, porque `gray-light-2` dá 1,37:1 e 2,21:1, abaixo dos 3:1 do texto grande. Card como `article` até o UC03 transformá-lo em botão. Estados de carregamento, vazio e erro derivados dos tokens (`notInDesign`). Só a primeira capa sem `lazy` (`fetchpriority="high"`, candidata a LCP).
- **Correção no UC01:** o `max-w-content` do `main` incluía o padding, e a grade ficava com 1266 px (colunas de 304,5 px). Agora o limite vale para o conteúdo (1316 px), com o gutter por fora.
- **Verificação:** `pnpm validate` (134 testes), `pnpm test:e2e` (5), nenhuma URL `figma.com` no código, nota 80 em `rgb(255, 184, 0)` no e2e. `pnpm lighthouse:ci` com CLS 0 em todas as rodadas, mas performance de 89 a 91 (mínimo 90): LCP de 3,4 a 3,7 s na cadeia HTML → JS → preflight CORS → GraphQL → capa.
- **Commits:** `feat: add score tone rule to domain`, `feat: list animes in cards with loading, empty and error states`, `test: verify anime listing end to end`.
- **PR sugerido:** `feat: list animes from anilist (uc02)`.

### SETUP-01: Apollo Client 4 e GraphQL Codegen

- **Escopo:** dependências e `codegen.ts`; schema do AniList versionado; `apollo-client.ts`, `cache.ts`, `mappers.ts` e query `AnimePage`; reducer de filtros, `CatalogProvider` e facade `use-catalog`; `ErrorBoundary`; utilitários de teste (MSW, fixtures, `renderWithCatalog`); regra de fronteira no ESLint; passo de codegen no CI; ADR-003, ADR-002, plano, prompts UC02 a UC06, arquitetura, README e changelog. Nenhuma tela nova.
- **Abordagem:** TDD. Os testes (cache, client, mappers, reducer, facade, Error Boundary e fronteira de lint) vieram antes da implementação e falharam pela ausência dos módulos. Depois, a menor implementação até ficar verde e o refactor com a suíte verde. Documentação externa do Apollo 4 (migração, Codegen, paginação) consultada na hora, não da memória.
- **Verificação:** `pnpm codegen`, `pnpm validate` (67 testes), `pnpm typecheck`, `pnpm test:e2e`, `pnpm audit --audit-level high`, `pnpm lighthouse:ci` (100/100/100/91). Bundle medido no build (+49,9 KB gzip) e isolado com esbuild (Apollo +63,6 KB contra TanStack Query +9,9 KB).
- **Commits:** `build: add apollo client and graphql codegen`, `feat: configure apollo cache and catalog facade`, `ci: generate graphql types in pipeline`, `docs: replace tanstack query with apollo client (adr-003)`.
- **PR sugerido:** `feat: configure apollo client as data layer`.

### Integração contínua no GitHub Actions

- **Escopo:** `.github/workflows/ci.yml`, ação composta `.github/actions/setup`, notas mínimas em `scripts/lighthouse.js` (com testes), scripts `typecheck`, `packageManager` e `engines` no `package.json`, documentação.
- **Abordagem:** TDD nas regras de nota do Lighthouse (testes antes da implementação); SDD com o pipeline especificado em `ARQUITETURA-E-FERRAMENTAS.md`.
- **Verificação:** YAML validado (estrutura, `needs` e Actions fixadas por SHA); localmente, `format:check`, `lint`, `typecheck`, `test:coverage` (24 testes), `build`, `test:e2e`, `lighthouse:ci`, `pnpm audit` e os comandos do estágio 1 sobre os commits da branch.
- **Commits:** `build: enforce lighthouse minimum scores`, `ci: add github actions pipeline`, `docs: document ci pipeline`.
- **PR sugerido:** `ci: add github actions pipeline`.

### Assets do Figma, base de contexto (RAG) e plano de implementação

- **Escopo:** `public/brand/logo.svg`, `public/icons/add.svg`, `docs/design-context/` (manifesto, tokens, 7 specs, 7 renders, fixtures e código de referência), `docs/adr/ADR-001`, `docs/PLANO-IMPLEMENTACAO.md`, `docs/prompts/` (README e UC01 a UC06), atualização de README, DESIGN, arquitetura, changelog e AI log. Sem alteração de código da aplicação.
- **Abordagem:** SDD; o design virou artefato versionado e cada UC ganhou um prompt que exige retrieval antes da implementação e descreve os testes BDD/TDD.
- **Verificação:** SVGs renderizados no Chromium e comparados com os renders do Figma; JSONs validados; links internos conferidos; `pnpm format:check`.
- **Commits sugeridos:** `feat: add design assets exported from figma` (public), `docs: add design context base and rag adr`, `docs: add implementation plan and use case prompts`.
- **PR sugerido:** exporta os assets do Figma, cria a base de contexto de design para retrieval (ADR-001) e define o plano de implementação com prompts por caso de uso.

### Paginação por "Ver mais", faixas da nota e AniList

- **Escopo:** documentação (README, requisitos, casos de uso, design, arquitetura, changelog e AI log), sem alteração de código.
- **Abordagem:** SDD e BDD; a regra de cor da nota virou cenário Gherkin no UC02 e o UC06 passou a descrever o clique em "Ver mais", ambos com o teste TDD correspondente mapeado.
- **Verificação:** `pnpm format:check` e busca por "scroll infinito" nos documentos de especificação.
- **Commit:** `docs: adopt load more pagination and define score colors`.
- **PR sugerido:** alinha a especificação ao design: paginação pelo botão "Ver mais", faixas de cor da nota e AniList como fonte de dados.

### Referência do Figma, versionamento de pacote único e branch própria

- **Escopo:** `docs/DESIGN.md`, descrição do README a partir do Figma, adaptação de `scripts/bump-versions.js` com testes e commits em `feat/estrutura-base`.
- **Abordagem:** SDD (design documentado antes da implementação das telas) e TDD no script (testes de `commitLevel`, `bump`, `targetVersion` e `isVersionOnlyDiff` escritos antes da refatoração).
- **Verificação:** `pnpm validate` (20 testes: 2 de UC01 e 18 do script) e `pnpm version:bump --dry-run`.
- **Commits:** os três commits descritos no `CHANGELOG.md`.
- **PR sugerido:** estrutura base da aplicação, referência visual do Figma e versionamento automático de pacote único.

### Documentar React 19 e React Compiler

- **Escopo:** documentação das escolhas de React 19 e React Compiler (README, arquitetura, changelog e AI log), sem alteração de código.
- **Abordagem:** SDD; cada funcionalidade do React 19 e o benefício do compilador foram associados aos casos de uso e RNF que atendem.
- **Verificação:** `pnpm format:check`.
- **Commit:** incorporado a `docs: document project, design, requirements and use cases`.
- **PR sugerido:** registra a escolha do React 19 pelas novas funcionalidades e do React Compiler para otimizar a renderização.

### Estrutura base

- **Escopo:** estrutura base (Tailwind, Biome, ESLint, Vitest, Playwright, Commitlint, Lighthouse), página UC01 e documentação.
- **Abordagem:** SDD para organizar os artefatos, BDD para os critérios de UC01 e TDD (vermelho → verde) para a estrutura da página.
- **Verificação:** `pnpm validate`, `pnpm test:e2e` e `pnpm lighthouse:ci` executados com sucesso.
- **Commits:** `build: scaffold vite react app with tailwind`, `chore: configure quality gates and commit conventions`, `docs: document project, design, requirements and use cases`.
- **PR sugerido:** estrutura base da aplicação com gates de qualidade, UC01 testado e documentação organizada em `docs/`.

## Meus ajustes

- Removi o excesso de conteúdo da página de exemplo porque ela será substituida em breve
- Modifiquei os Requisitos Funcionais, Requisitos Não Funcionais e Casos de Uso para os que tinha criado baseado no desafio
- Corrigi detalhes de layout para corresponder ao frame do figma (peso e cor da fonte - o Claude tinha ajustado para seguir regras de contraste)
