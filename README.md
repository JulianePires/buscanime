# Buscanime

Aplicação web de busca de animes construída para o desafio Frontend da Winnin, com desenvolvimento assistido pelo Claude Code e guiado por Spec Driven Development (SDD), Behavior Driven Development (BDD) e Test Driven Development (TDD). A direção visual parte do [Figma do desafio Winnin](https://www.figma.com/design/uHjhK532Aq0D6L4teYX6bz/INSTITUCIONAL----DesafioWinnin--Copy-?node-id=0-1&t=nSRYqbMWXssxQlbl-1).

## Descrição

O Buscanime é uma página única para explorar um catálogo de animes. No topo, um header roxo com o logotipo **BUSCANIME**. Logo abaixo, uma linha de filtros por formato (All Formats, TV Show, Movie, TV Short, Special, OVA, ONA e Music) e um campo de busca por texto com o botão "Buscar". O conteúdo principal é uma grade de cards com a capa, o título, os gêneros e a nota de cada anime em percentual (verde, amarela ou vermelha conforme a avaliação). Ao final da grade, a ação "Ver mais" carrega novos títulos sem recarregar a tela, e o footer fecha a página com o logotipo.

Casos de uso previstos:

- **UC01** - Visualizar estrutura da página
- **UC02** - Visualizar listagem de animes
- **UC03** - Visualizar detalhe do anime listado
- **UC04** - Filtrar lista por um ou mais formatos
- **UC05** - Filtrar lista por busca de texto
- **UC06** - Alterar tamanho de paginação ("Ver mais")

Estado atual: estrutura base da página (UC01) com cabeçalho, navegação e área principal; os demais casos de uso estão especificados e serão implementados em ciclos TDD.

## Design

Estrutura da página, tokens de cor (primária `#6324C6`; nota vermelha abaixo de 50, amarela de 50 a 80 e verde acima de 80) e tipografia (Mulish) extraídos do Figma.

Detalhes em [docs/DESIGN.md](docs/DESIGN.md).

### Base de contexto de design (RAG)

Os assets do Figma (logo e ícone em SVG) foram exportados para `public/`, e o design foi convertido em uma base local versionada (`docs/design-context/`): specs por seção, tokens, renders de referência, fixtures e um índice por caso de uso. A IA consulta essa base antes de implementar cada UC, em vez de reconsultar o Figma, ganhando fidelidade, economia de tokens e reprodutibilidade.

Decisão em [ADR-001](docs/adr/ADR-001-base-de-contexto-de-design-rag.md); base em [docs/design-context/](docs/design-context/README.md).

## Requisitos funcionais (RF)

Navegação, listagem, filtro por formato, busca por texto, detalhes, paginação pelo botão "Ver mais", tamanho da paginação e responsividade (RF01 a RF08).

Detalhes em [docs/REQUISITOS.md](docs/REQUISITOS.md#requisitos-funcionais-rf).

## Requisitos não funcionais (RNF)

Acessibilidade, performance, qualidade, compatibilidade, manutenibilidade e feedback de estados (RNF01 a RNF06).

Detalhes em [docs/REQUISITOS.md](docs/REQUISITOS.md#requisitos-não-funcionais-rnf).

## Casos de uso

Atores, critérios BDD (Gherkin) e mapeamento TDD de UC01 a UC06.

Detalhes em [docs/USE_CASES.md](docs/USE_CASES.md).

## Plano de implementação

Sequência UC01 → UC02 → (UC03, UC04 → UC05, UC06), arquitetura em camadas (domínio, adapter do AniList, feature, apresentação), padrões de projeto, características de qualidade (ISO/IEC 25010) e Definition of Done. Cada UC tem um prompt documentado para o Claude Code.

Detalhes em [docs/PLANO-IMPLEMENTACAO.md](docs/PLANO-IMPLEMENTACAO.md) e [docs/prompts/](docs/prompts/README.md).

## Arquitetura e ferramentas

React 19 + TypeScript + Vite, Tailwind CSS 4, ESLint + SonarJS (code smells), Biome, Vitest + Testing Library, Playwright, Commitlint + Husky + lint-staged e Lighthouse.

- **React 19:** escolhido pelas novas funcionalidades (`use` + `Suspense`, transições assíncronas, `useOptimistic`, `ref` como prop e metadados no componente), que atendem à busca, aos filtros, ao detalhe e ao carregamento pelo "Ver mais".
- **Fonte de dados:** [API GraphQL do AniList](https://docs.anilist.co/), cujos formatos (`MediaFormat`) são os mesmos dos filtros do design.
- **React Compiler:** escolhido para otimizar a renderização com memoização automática em tempo de build, sem `useMemo`/`useCallback` manuais.

Detalhes em [docs/ARQUITETURA-E-FERRAMENTAS.md](docs/ARQUITETURA-E-FERRAMENTAS.md).

## Histórico e trabalho com IA

- [docs/CHANGELOG.md](docs/CHANGELOG.md): mudanças registradas por commit.
- [docs/AI_LOG.md](docs/AI_LOG.md): ferramentas, organização, verificação, correções, decisões e ajustes da IA.
- [docs/adr/](docs/adr/): registros de decisões de arquitetura (ADR).

## Desenvolvimento

Pré-requisitos: Node.js 22+ e pnpm.

```bash
pnpm install
pnpm exec playwright install chromium   # navegador do e2e e do Lighthouse
pnpm dev                                # http://localhost:5173
pnpm validate                           # formato, lint, testes unitários e build
pnpm test:e2e                           # fluxos no navegador
pnpm lighthouse:ci                      # gera reports/lighthouse.html
```

Mensagens de commit seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), validadas pelo Commitlint (ex.: `feat: add anime filters`).
