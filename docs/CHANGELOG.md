# Changelog

Mudanças documentadas por commit, seguindo [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e Conventional Commits. Cada entrada leva a mensagem do commit correspondente; o hash pode ser consultado com `git log --oneline`.

## [Unreleased]

### `chore: initial commit` (main)

- Commit vazio que inicia a `main`, base para a branch `feat/estrutura-base` e para o cálculo de versão.

### `build: scaffold vite react app with tailwind`

#### Added

- Projeto React 19 + TypeScript + Vite com React Compiler e Tailwind CSS 4.
- Estrutura base da página (UC01): cabeçalho com navegação principal rotulada e área principal.
- `.gitattributes` normalizando finais de linha para LF.
- `index.html` com `lang="pt-BR"`, título e descrição voltados à busca de animes.

### `chore: configure quality gates and commit conventions`

#### Added

- ESLint com regras de code smells (tamanho, complexidade, legibilidade, código morto, duplicação e SonarJS).
- Biome para formatação e lint complementar, incluindo arquivos de configuração.
- Vitest + Testing Library com testes de UC01 e Playwright com o fluxo e2e de UC01.
- Commitlint, Husky e configuração do lint-staged usada pelo `pre-commit`.
- `scripts/lighthouse.js` e comandos `lighthouse` / `lighthouse:ci` gerando `reports/lighthouse.html`.
- `scripts/bump-versions.js` adaptado para pacote único (somente `package.json` da raiz), sem erro quando não há `main`, com testes das regras de bump.

### `docs: document project, design, requirements and use cases`

#### Added

- README com descrição baseada no Figma, UC01 a UC06 e seções de design, RF, RNF, casos de uso e arquitetura/ferramentas.
- `docs/DESIGN.md` com estrutura da página, tokens de cor e tipografia do Figma.
- Documentos por tipo em `docs/`: requisitos, casos de uso (BDD/TDD), arquitetura e ferramentas, changelog e AI log.
- Decisões de arquitetura: React 19 pelas novas funcionalidades e React Compiler para otimização da renderização.
- Versionamento de pacote único e fluxo de branches em `ARQUITETURA-E-FERRAMENTAS.md`.

### `docs: adopt load more pagination and define score colors`

#### Changed

- RF06, UC06, README e arquitetura: paginação pelo botão "Ver mais" no lugar do scroll infinito.
- `DESIGN.md`: faixas de cor da nota (`< 50` perigo, `50–80` alerta, `> 80` sucesso) e AniList confirmado como fonte de dados.

#### Added

- Cenário BDD de cor da nota no UC02 e AniList na stack.

### `feat: add design assets exported from figma`

#### Added

- `public/brand/logo.svg` (logo BUSCANIME em contorno) e `public/icons/add.svg` (ícone do "Ver mais"), exportados dos nós do Figma.

### `docs: add design context base and rag adr`

#### Added

- `docs/design-context/`: manifesto por caso de uso, tokens em JSON, specs por seção, renders de referência, fixtures dos cards e código de referência do Figma.
- `docs/adr/ADR-001-base-de-contexto-de-design-rag.md`: decisão de usar a base local como fonte de retrieval da IA.
- `docs/adr/ADR-002-dependencias-de-dados-ui-e-formularios.md`: TanStack Query para dados remotos; componentes e busca sem shadcn/ui e sem React Hook Form. Plano e prompts UC02, UC04, UC05 e UC06 atualizados.

#### Changed

- `DESIGN.md`: tipografia corrigida (logo Mulish Regular 40 px), seção de assets, divergências de contraste e lacunas do design.
- README e arquitetura: seção da base de contexto e nova estrutura de pastas.

### `docs: add implementation plan and use case prompts`

#### Added

- `docs/PLANO-IMPLEMENTACAO.md`: arquitetura alvo, padrões de projeto, sequência, plano por UC, Definition of Done e decisões em aberto.
- `docs/prompts/`: padrão de prompt e prompts de UC01 a UC06.

### `docs: confirm score color thresholds`

#### Changed

- `DESIGN.md` e AI log: faixas da nota reconfirmadas (50 e 80 na faixa amarela), prevalecendo sobre o exemplo de 80% em verde no Figma.

### `build: enforce lighthouse minimum scores`

#### Changed

- `scripts/lighthouse.js` gera relatórios HTML e JSON (`reports/lighthouse.report.*`), falha abaixo das notas mínimas (performance 90, acessibilidade 95, boas práticas 90, SEO 90) e chama o CLI sem shell.

#### Added

- `scripts/lighthouse.test.js` com as regras de nota mínima.

### `ci: add github actions pipeline`

#### Added

- `.github/workflows/ci.yml`: commits e versionamento → qualidade, segurança (pnpm audit, Dependency Review) e CodeQL → testes → build → e2e e Lighthouse.
- `.github/actions/setup`: ação composta com Node 24, pnpm e `pnpm install --frozen-lockfile`.
- `package.json`: script `typecheck`, `packageManager` (pnpm 10.34.6) e `engines` (Node 22.12+).

### `docs: document ci pipeline`

#### Changed

- `ARQUITETURA-E-FERRAMENTAS.md`: seção de integração contínua, estágios, decisões e novos comandos.
- README: seção de integração contínua e pré-requisitos.
- AI log: registro desta alteração.
