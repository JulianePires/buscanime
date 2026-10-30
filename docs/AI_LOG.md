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
- **Playwright:** validação da experiência no navegador.
- **Commitlint + Husky + lint-staged:** padronização de mensagens e checagem dos arquivos antes do commit.
- **Lighthouse:** auditoria de performance, acessibilidade, boas práticas e SEO (executado com o Chromium do Playwright).
- **Figma MCP:** leitura da estrutura do frame e dos tokens (cores e tipografia) a partir da cópia acessível do arquivo do desafio.

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

## Verificação do trabalho

O comando `pnpm validate` concentra a validação local:

- `pnpm format:check`: garante que o Biome não detecta divergências.
- `pnpm lint`: executa ESLint e regras de code smells.
- `pnpm test`: executa os testes unitários.
- `pnpm build`: confirma a compilação TypeScript e o build de produção.
- `pnpm test:e2e`: valida a página compilada no Chromium.
- `pnpm lighthouse:ci`: gera o relatório em `reports/lighthouse.html`.

Última verificação (30/10/2026): `pnpm validate` verde (Biome, ESLint, 2 testes Vitest, build), `pnpm test:e2e` com 1 teste aprovado e Lighthouse com Performance 100, Acessibilidade 100, Boas práticas 100 e SEO 91.

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

## Ajustes da IA

- O layout inicial é uma interpretação estrutural do Figma, não uma cópia final de conteúdo ou identidade. Textos, imagens e contatos devem ser substituídos pelo material oficial.
- A configuração foi mantida modular para que a próxima etapa possa extrair componentes e conectar dados reais sem alterar os gates de qualidade.
- A descrição do README foi reescrita a partir do frame do Figma (header, filtros, busca, grade de cards, "Ver mais" e footer).
- As faixas de cor da nota e a relação dos formatos com a API do AniList, antes inferidas do design, foram confirmadas na revisão e documentadas em `docs/DESIGN.md`.
- Os conteúdos de RF, RNF e casos de uso ajustados manualmente (ver "Meus ajustes") foram preservados; só RF06 e UC06 mudaram de scroll infinito para "Ver mais", por solicitação na revisão, e o UC02 ganhou o cenário de cor da nota.
- No Figma, o card com 80% aparece verde, mas pela regra definida 80 é amarelo; a regra definida prevalece.

## Pendências

- SEO do Lighthouse em 91: avaliar os itens apontados no relatório.
- Publicar a `main` e a branch no `origin` para abrir o PR.

## Registro de alterações

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
