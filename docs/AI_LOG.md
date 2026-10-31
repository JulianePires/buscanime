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
18. Implementar o UC04 em TDD: filtro de formatos com seleção múltipla, seleção otimista com `useOptimistic` e verificação do `format_in` no e2e.
19. Implementar o UC05 em TDD: busca por texto disparada no submit ou após o debounce da digitação, combinada com os formatos, e lista vazia com o termo pesquisado.
20. Implementar o UC06 em TDD: "Ver mais" acumulando páginas com foco no primeiro card novo e erro da página seguinte sem derrubar a lista; o seletor de itens por página foi removido na revisão por não constar no Figma.

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
- **Preconnect do GraphQL no `index.html`, não no `preconnect()` do React 19:** testado em 31/10/2026 com quatro builds (sem preconnect; só `index.html`; `index.html` + `preconnect()` no `App`; só `preconnect()`), contra o AniList real. No trace do Lighthouse, o `<link rel="preconnect" crossorigin>` do HTML encurtou o preflight CORS de ~163 ms para ~65 ms (a conexão já estava aberta) e a resposta chegou ~50 ms antes. O `preconnect()` sozinho reduziu pouco (~133 ms): numa SPA ele só roda no render, junto com a própria requisição, e sem `crossOrigin` cai no pool de conexões errado para o fetch CORS anônimo. Somado ao link do HTML, não muda nada: o React encontra o link existente e não insere outro. Nenhuma variante tirou o LCP (3,6–3,7 s) nem a nota de performance (81–90) da faixa de ruído; o gargalo do LCP segue sendo a cadeia HTML → JS → GraphQL → capa. O `preconnect()` do React só faria diferença com SSR, em que entra no `<head>` do HTML enviado.
- **LCP de 2,75 s para 0,88 s em média:** a combinação dos ajustes no carregamento derrubou o LCP médio de 2,75 s para 0,88 s (−68%). Os ajustes foram o `preconnect` do `index.html` para a API (`graphql.anilist.co`, com `crossorigin`) e para o CDN das capas (`s4.anilist.co`), e `loading="eager"` nas capas dos cards, que deixam de esperar o lazy loading. A primeira capa continua com `fetchpriority="high"`. O gargalo apontado na decisão anterior (a cadeia HTML → JS → GraphQL → capa) ficou mais curto porque as conexões já estão abertas quando o JS pede a lista e as capas.

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
- Confirmar as decisões em aberto do plano: contraste do "Ver mais" e do chip da nota.
- Ativar no GitHub a proteção da `main` exigindo os checks do CI antes do merge.
- Avaliar um mínimo de cobertura no Vitest quando os UCs com lógica de domínio forem implementados.
- Contraste do "Ver mais": o UC06 manteve o branco do Figma (≈ 1,7:1) e a Acessibilidade do Lighthouse caiu de 100 para 96 só por esse item; decidir entre o design e o texto `primary` (≈ 4,6:1).
- Performance do Lighthouse em 87–88 (mínimo 90) já na base do UC06, por LCP de 3,7–3,9 s na capa servida pelo AniList real.
- Acompanhar o bundle quando o UC02 passar a usar a facade (esperado perto de +64 KB gzip) e o Lighthouse de Performance.
- Revisar o `pnpm.overrides` de `@graphql-tools/utils` ao atualizar o GraphQL Codegen.

## Registro de alterações

### UC06: Carregar mais animes pelo "Ver mais"

- **Escopo:** `src/components/pagination/LoadMoreButton.tsx`; `loadMoreError` em `use-catalog.ts`; `ref` como prop no `AnimeCard` e `focusIndex` no `AnimeGrid`; botão no `CatalogResults`; `e2e/load-more.spec.ts` e `pages` no `mockAniList`. O reducer, a chave do cache com `perPage` e o `merge` de `Page.media` já vinham do SETUP-01; a ação `setPerPage` saiu da facade junto com o RF07 e ficou só no reducer, disparada pela largura da tela (`src/domain/page-size.ts` e `use-viewport-page-size.ts`). Sem scroll infinito e sem `IntersectionObserver`.
- **Abordagem:** TDD na ordem do prompt: facade (msw: a falha da página 2 mantém os itens, expõe `loadMoreError`, a nova tentativa carrega e trocar os filtros descarta o erro), `LoadMoreButton.test.tsx`, foco no `AnimeGrid.test.tsx`, integração em `src/App.load-more.test.tsx` (acervo de 36 paginado por `page`/`perPage`) e e2e. Cada camada ficou vermelha antes da implementação; um teste de mutação (tirar a ref do card alvo) derruba o cenário de foco.
- **Decisão (próxima página sem `fetchMore`):** o `fetchMore` do `useSuspenseQuery` rejeita a promise que a lista lê com `use()` quando a requisição falha (`QueryReference.initiateFetch`), com qualquer `errorPolicy`, e o `try/catch` não impede a lista de ir ao Error Boundary. A facade passou a pedir a página com `client.query` (`network-only`): como `page` fica fora da chave do `Page`, a resposta grava na mesma entrada e o `merge` acumula e deduplica, como antes; a deduplicação continua só no `cache.ts`. O erro guarda os filtros em que ocorreu e só aparece para eles (estado derivado, sem efeito de reset).
- **Foco:** o `CatalogResults` guarda o índice do primeiro card novo junto com os filtros do clique; o `AnimeGrid` passa uma ref de callback estável (`focusOnMount`) ao card nesse índice, que foca o botão do card ao montar. Trocar os filtros invalida o alvo, então a lista nova não rouba o foco, e uma falha não foca nada.
- **Tamanho da página por largura (pedido na revisão):** `pageSizeForWidth` em `src/domain/page-size.ts` (até 610 px → 3, até 919 → 6, até 1219 → 9, a partir de 1220 → 12; as bordas 920 e 1220 ficaram na faixa de cima). O `CatalogProvider` inicia o reducer com a largura atual e `useViewportPageSize` escuta três `matchMedia` (`min-width` 611, 920 e 1220) com `useEffectEvent`: o evento só dispara ao cruzar uma faixa, e a troca vai pela mesma transição dos filtros (lista anterior visível, depois a página 1 com o novo tamanho; voltar a uma faixa já vista vem do cache). O `setPerPage` devolve o mesmo estado para o mesmo tamanho, então cruzar várias faixas de uma vez gera uma requisição só e não invalida o erro nem o foco do "Ver mais". O esqueleto reserva o tamanho da faixa (3 cards no mobile). Nos testes, `src/test/viewport.ts` começa em 1280 px e tem um polyfill de `matchMedia` com `resizeViewport`.
- **Divergências do Figma e do prompt:** o texto e o ícone ficam brancos sobre `#FFB800` (≈ 1,7:1, abaixo do AA), porque a decisão de contraste do plano segue em aberto; o Lighthouse aponta só esse item (Acessibilidade 96). O seletor de itens por página (RF07) chegou a ser implementado e foi removido na revisão por não constar no Figma; o RF07 saiu dos requisitos (e o `notInDesign.tamanho-pagina` do manifesto); o tamanho da página passou a seguir a largura da tela (3 itens até 610 px, 6 até 919 px, 9 até 1219 px e 12 a partir de 1220 px, pedido na revisão). Carregamento ("Carregando...", desabilitado, opacidade 80%), hover (`brightness-95`), foco (2 px `primary`) e a mensagem de erro com "Tentar novamente" são derivados. O botão fica dentro do `Suspense` (some na primeira carga, no erro e na lista vazia, quando não há o que paginar). O prompt pedia `fetchMore`; ver a decisão acima.
- **Verificação:** `pnpm validate` (Biome, ESLint sem avisos, 213 testes em 27 arquivos, build) e `pnpm test:e2e` (17). Capturas a 1366 e 375 px comparadas com `references/ver-mais.png`: botão de 1316 × 48, ícone 30 × 24 e texto centralizados, sem rolagem horizontal a 375 px. `pnpm lighthouse:ci` reprovou: Performance 85 (mínimo 90; antes do tamanho por largura, 87; a base sem o UC06 mediu 88; LCP de 3,7–3,9 s na capa do AniList em todas), Acessibilidade 96 (contraste do "Ver mais"), Boas práticas 100, SEO 92.
- **Commit:** `feat: load more animes`.
- **PR sugerido:** `feat: load more animes (uc06)`.

### UC05: Filtrar lista por busca de texto

- **Escopo:** `src/components/filters/SearchBar.tsx`; `EmptyState` com o termo pesquisado (via `CatalogResults`); busca no `main` do `App`, entre os filtros e a lista, fora do `Suspense`; `--container-search` (1012 px) no `@theme`; `e2e/search.spec.ts`. A ação `search(term)` da facade, a normalização no reducer (trim; vazio remove o filtro) e a ordenação em `toAnimePageVariables` (`SEARCH_MATCH` com termo, `POPULARITY_DESC` sem) já vinham do SETUP-01 e não mudaram. Sem autocomplete e sem estado na URL.
- **Abordagem:** TDD na ordem do prompt: `SearchBar.test.tsx` e o caso com termo do `EmptyState.test.tsx` (vermelhos por falta do componente e da prop); integração com msw aplicando `search` e `format_in` a um acervo de três títulos; e2e com Enter, variáveis da requisição e medidas a 1366 px. Os cenários Gherkin viram `describe` com o mesmo texto, mais um cenário de campo vazio (remove o termo e volta ao cache sem requisição).
- **Decisões:** campo não controlado lido com `FormData` no `onSubmit` + `preventDefault`, sem `<form action>` (o React 19 reseta os campos não controlados) e sem React Hook Form (ADR-002); `defaultValue` vem da seleção otimista. Repetir a mesma busca não refaz a requisição porque as variáveis normalizadas são iguais e o Apollo responde do cache. `normalizeSearch` não foi extraído para `src/domain/search.ts`: só o reducer usa o trim, e a extração seria só indireção.
- **Debounce (pedido na revisão, contra o anti-objetivo do prompt):** a digitação agenda a busca para 400 ms (`SEARCH_DEBOUNCE_MS`) depois da última tecla; o submit (botão ou Enter) busca na hora e cancela a busca agendada, e a desmontagem também a cancela. Limpar o campo, inclusive pelo "x" do `input type="search"`, remove o filtro depois da pausa. Testado com timers falsos no `SearchBar.test.tsx` (só o último texto vira busca; o submit não duplica), na integração (três mudanças rápidas viram uma requisição) e no e2e (teclas a cada 50 ms geram uma requisição só, com o texto final). O e2e confere a ausência de requisições intermediárias pela lista de variáveis, sem espera fixa (o Sonar proíbe `waitForTimeout`).
- **Divergências do Figma e do prompt:** `form role="search"` com `biome-ignore` do `useSemanticElements`, porque o Biome sugere `<search>` e o aria-query do Testing Library 10.4 ainda não mapeia esse elemento para o papel "search" (o teste falhou com ele). O foco é só a borda `primary` de 1 px, como no spec. O hover do botão (`primary-light-1`) é derivado. Os testes de integração do UC05 ficaram em `src/App.search.test.tsx`, não no `App.test.tsx`, para os dois arquivos ficarem dentro do `max-lines` do ESLint. O e2e do UC03 passou de 10 para 12 Tabs até o primeiro card (campo e "Buscar" entram na ordem de foco).
- **Verificação:** `pnpm validate` (Biome, ESLint sem avisos, 184 testes em 24 arquivos, build) e `pnpm test:e2e` (14). Captura a 1366 px comparada com `references/busca.png`: conjunto de 1012 px centralizado, botão 86 × 38, gap de 10 px; a 375 px sem rolagem horizontal.
- **Commit:** `feat: search anime by text`.
- **PR sugerido:** `feat: search anime by text (uc05)`.

### UC04: Filtrar lista por um ou mais formatos

- **Escopo:** `src/components/filters/FormatFilter.tsx`; `useCatalogFilters()` e seleção otimista no `CatalogProvider`/contexto; `aria-busy` no `AnimeGrid`; filtros no `main` do `App`, fora do `Suspense`; `e2e/filters.spec.ts` e variáveis registradas no mock do AniList. `FORMAT_OPTIONS`, o reducer (`toggleFormat`/`clearFormats`) e `toAnimePageVariables` (`format_in` só com seleção) já vinham do SETUP-01/UC03 e não mudaram. Sem busca por texto e sem estado na URL.
- **Abordagem:** TDD na ordem do prompt: `formats.test.ts` já cobria as 8 opções; reducer ganhou só o caso de vários formatos; `FormatFilter.test.tsx` (vermelho por falta do componente); integração no `App.test.tsx` com msw aplicando o `format_in` a um acervo misto; e2e. Os cenários Gherkin viram `describe` com o mesmo texto.
- **Decisão (seleção otimista):** a facade troca os filtros em `startTransition`, então o `aria-pressed` só mudaria quando a nova página chegasse. O `useOptimistic` do React 19 com o próprio reducer mostra a escolha na hora; a consulta continua usando os filtros confirmados (usar os otimistas suspenderia a lista com urgência e mostraria o esqueleto). Um teste de mutação (trocar a seleção otimista pela confirmada) derruba o cenário "o botão fica marcado na hora".
- **Divergências do Figma:** larguras pelo padding de 19 px (115, 100, 79, 98, 88, 70, 72, 78 contra 119, 105, 76, 105, 88, 65, 67, 76; linha de 833 contra 834 px); borda de 1 px também no ativo, da cor do fundo, para manter 32 px; `fieldset` + `legend` oculta no lugar de `div role="group"` (exigência do Biome `useSemanticElements`, mesmo papel e nome); o `form role="search"` do `layout.md` fica para o UC05; hover, foco e o esmaecimento da lista durante a carga são derivados (`notInDesign`).
- **Verificação:** `pnpm validate` (Biome, ESLint sem avisos, 170 testes em 22 arquivos, build) e `pnpm test:e2e` (10). Captura da linha a 1366 px comparada com `references/filtros.png`; a 375 px a linha quebra em três sem rolagem horizontal.
- **Commit:** `feat: filter anime list by format`.
- **PR sugerido:** `feat: filter anime list by format (uc04)`.

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
- Adicionei efeitos de transição
  nos cards de anime e corrigi os cursores nos seus elementos
- Alterei a decisão de utilizar o Reqact Query para o Apollo Client por questões de compatibilidade, excesso de configurações e pela tipagem integrada
- Testei o `preconnect()` do React 19 no `App` para a queda de performance na requisição ao AniList e mantive apenas o preconnect do `index.html`: o do React não trouxe ganho medível (ver "Decisões")
- Com o preconnect do `index.html` (API e CDN das capas) e `loading="eager"` nas capas, o LCP caiu de 2,75 s para 0,88 s em média (ver "Decisões")
- Pedi debounce na busca por texto, que o prompt do UC05 excluía: a busca dispara 400 ms depois da última tecla, e o Enter/"Buscar" continua imediato (ver UC05 em "Registro de alterações")
- Pedi para remover um seletor de páginas que foi adicionado à parte. Divergia do layout proposto.
