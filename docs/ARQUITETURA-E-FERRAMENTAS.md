# Arquitetura e ferramentas

## Organização

O projeto segue uma arquitetura de frontend orientada a componentes:

```text
.github/
├── actions/setup/       # Ação composta: Node, pnpm e dependências
└── workflows/ci.yml     # Pipeline de CI
src/
├── App.tsx              # Composição da página (cabeçalho, navegação e área principal)
├── App*.test.tsx        # Integração da página: UC01 a UC04 e UC06 (UC05 em App.search)
├── index.css            # Tokens globais e importação do Tailwind
├── main.tsx             # Bootstrap: cria o ApolloClient e o injeta no CatalogProvider
├── domain/              # Tipos e regras puras (Anime, formatos, nota, tamanho da página)
├── services/anilist/    # Apollo Client, cache, schema, query, mappers e prefetch (ADR-003)
├── features/catalog/    # Reducer, CatalogProvider, facade use-catalog e largura da tela
├── components/          # Apresentação; não importa @apollo/client (regra do ESLint)
└── test/                # Setup do Vitest, MSW, fixtures e utilitários do Apollo
codegen.ts               # GraphQL Codegen: schema do AniList e tipos das operações
public/
├── brand/logo.svg       # Logo exportado do Figma
└── icons/add.svg        # Ícone do "Ver mais" exportado do Figma
e2e/                     # Fluxos de usuário com Playwright
scripts/                 # Automações de commit, versão e auditoria
reports/                 # Relatórios gerados (Lighthouse), fora do versionamento
docs/                    # Requisitos, casos de uso, arquitetura e registros do trabalho
├── adr/                 # Registros de decisões de arquitetura
├── design-context/      # Base de contexto de design para retrieval (ADR-001)
└── prompts/             # Prompts de implementação por caso de uso
```

A arquitetura alvo dos casos de uso (domínio, adapter do AniList, feature e apresentação) está em [PLANO-IMPLEMENTACAO.md](PLANO-IMPLEMENTACAO.md#arquitetura-alvo).

O Vite faz o bundling e o Tailwind é integrado pelo plugin oficial. O ESLint cuida de problemas semânticos e code smells, o Biome padroniza a escrita e o comando `pnpm validate` funciona como gate local.

## Stack

- React 19 + TypeScript + Vite (com React Compiler via Babel).
- [API GraphQL do AniList](https://docs.anilist.co/) como fonte de dados (busca, formatos, gêneros, nota e capa dos animes).
- Apollo Client 4 (cache normalizado, `useSuspenseQuery`) e GraphQL Codegen (`typescript-operations` + `typed-document-node` + `near-operation-file`) como camada de dados ([ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md)).
- Tailwind CSS 4 para estilos utilitários.
- ESLint 10 + `typescript-eslint` + `eslint-plugin-sonarjs` para code smells.
- Biome para formatação, organização de imports e lint complementar.
- Vitest + Testing Library (jsdom) para testes unitários e de integração, com MSW mockando o AniList na fronteira de rede.
- Playwright (Chromium) para testes end-to-end sobre o build de produção.
- Commitlint + Husky + lint-staged para commits convencionais e checagens antes do commit.
- Lighthouse para auditoria de performance, acessibilidade, boas práticas e SEO.
- Claude Code como ferramenta de apoio ao SDD, BDD, TDD, implementação e documentação.

## Decisões de arquitetura

### React 19

Escolhido pelas novas funcionalidades, que atendem diretamente aos casos de uso:

| Funcionalidade                                | Uso previsto no Buscanime                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Suspense` (via `useSuspenseQuery`)           | Ler a busca de forma declarativa; o Apollo fornece as promises estáveis que o Suspense exige (UC02, RNF06, [ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md)). |
| Transições assíncronas (`useTransition`)      | Manter a interface responsiva ao aplicar filtros de formato e busca por texto (UC04, UC05).                                                                               |
| `useDeferredValue` com valor inicial          | Adiar a atualização da listagem enquanto o usuário digita na busca (UC05).                                                                                                |
| `useOptimistic` / Actions                     | Refletir imediatamente a seleção de filtros antes da resposta dos dados (UC04).                                                                                           |
| `ref` como prop                               | Devolver o foco ao primeiro item novo após o "Ver mais", sem `forwardRef` (UC06, RNF01).                                                                                  |
| Metadados no componente (`<title>`, `<meta>`) | Atualizar título e descrição ao abrir o detalhe de um anime, favorecendo SEO e acessibilidade (UC03, RNF01).                                                              |

### React Compiler

Escolhido para otimizar a renderização sem memoização manual:
- Memoiza automaticamente componentes, valores derivados e callbacks em tempo de build, dispensando `useMemo`, `useCallback` e `React.memo` escritos à mão.
- Reduz re-renderizações da listagem ao filtrar, buscar e carregar novas páginas pelo "Ver mais" (UC02, UC04 a UC06, RNF02).
- Mantém o código mais simples e legível, alinhado às regras de code smells.
- Configurado no `vite.config.ts` via `@rolldown/plugin-babel` com `reactCompilerPreset()`; o `eslint-plugin-react-hooks` 7 aplica as regras que o compilador exige (pureza de componentes e regras de hooks).
- Memoização manual só deve ser usada quando uma medição mostrar ganho que o compilador não obteve.

### Base de contexto de design (RAG)

O desenvolvimento assistido por IA recupera o design de `docs/design-context/` em vez de consultar o Figma a cada ciclo: o `manifest.json` liga cada caso de uso às specs, referências e assets da seção. Motivação, alternativas e consequências no [ADR-001](adr/ADR-001-base-de-contexto-de-design-rag.md).

### Camada de dados (Apollo Client + GraphQL Codegen)

- **Única camada de dados remotos:** Apollo Client 4 com cache normalizado (`Media:<id>`). As páginas do "Ver mais" se acumulam pelas `typePolicies` de `cache.ts`, e voltar a uma combinação de filtros já vista não faz requisição. Substitui o TanStack Query do ADR-002 ([ADR-003](adr/ADR-003-apollo-client-como-camada-de-dados.md)).
- **Tipos gerados:** `pnpm codegen` gera os tipos das operações a partir de `src/services/anilist/schema.graphql`, que é versionado. Os `*.generated.ts` ficam fora do Git e são ignorados pelo ESLint e pelo Biome. O schema só muda com `pnpm codegen:schema`, que acessa a rede.
- **Fronteira:** os componentes usam a facade `useCatalog()` e tipos do domínio. Importar `@apollo/client*` fora de `src/services` e `src/features` é erro de lint (`no-restricted-imports`), e um teste garante a regra.
- **Erros:** não há reenvio automático (nem em HTTP 429). Falha na primeira página vai ao `ErrorBoundary` ("Tentar novamente" via `useCatalogRetry()`); falha no "Ver mais" vira `loadMoreError` e mantém as páginas carregadas. A próxima página usa `client.query`, porque a falha do `fetchMore` do `useSuspenseQuery` derrubaria a lista.
- **Tamanho da página:** segue a largura da tela (3, 6, 9 ou 12 itens; `src/domain/page-size.ts`). O `CatalogProvider` começa pela largura atual e acompanha as faixas por `matchMedia`; voltar a uma faixa já vista vem do cache.
- **Transporte:** as consultas vão em campos de formulário (`application/x-www-form-urlencoded`), que o AniList aceita: é uma requisição simples de CORS, sem o `OPTIONS` antes. Os testes de integração mantêm o JSON, que o MSW lê.
- **Primeira página antes do JS:** um script inline no `index.html`, gerado no build (`prefetch.ts` e plugin no `vite.config.ts`), pede a primeira página logo depois do HTML e pré-carrega a primeira capa; o Apollo reaproveita a resposta. Medições no `AI_LOG.md` (Decisões).
- **Custo:** cerca de +64 KB gzip, contra ~10 KB do TanStack Query, medido no ADR-003. O bundle está em ~132 KB gzip, e o TBT dele é o que mais pesa na nota simulada do Lighthouse.

## Code smells verificados (ESLint)

| Categoria              | Regras                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tamanho e complexidade | `complexity` (10), `max-depth` (4), `max-params` (3), `max-lines` (300), `max-lines-per-function` (80), `max-nested-callbacks` (3), `sonarjs/cognitive-complexity` (15) |
| Legibilidade           | `eqeqeq`, `no-nested-ternary`, `no-else-return`, `no-var`, `prefer-const`, `no-console`                                                                                 |
| Código morto e tipagem | `no-unreachable-loop`, `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-explicit-any`                                                                        |
| Duplicação             | `no-duplicate-imports`, `sonarjs/no-duplicate-string` (3), `sonarjs/no-identical-functions` e o preset recomendado do SonarJS                                           |
| React                  | `react-hooks` (regras de hooks) e `react-refresh` (exports compatíveis com HMR)                                                                                         |

## Fluxo de commit

1. `pre-commit`: limita o commit a 30 arquivos (`scripts/check-commit-size.js`) e roda o lint-staged (Biome + ESLint nos arquivos staged).
2. `commit-msg`: valida a mensagem com Commitlint (`@commitlint/config-conventional`).
3. `post-commit` / `post-rewrite`: recalcula a versão do `package.json` da raiz em relação à `main` (`scripts/bump-versions.js`) e a emenda no último commit.

### Versionamento (pacote único)

O projeto é um pacote único: o `scripts/bump-versions.js` lê apenas o `package.json` da raiz e aplica um único bump por branch, o maior entre os commits desde o merge-base com a `main`:

| Commit                              | Bump  |
| ----------------------------------- | ----- |
| `tipo!:` ou `BREAKING CHANGE:`      | major |
| `feat`                              | minor |
| `fix`, `perf`, `revert`             | patch |
| demais tipos (`docs`, `chore`, ...) | —     |

Sem a `main` (repositório recém-criado) ou com o `package.json` ainda não commitado, o script só avisa e não altera nada. As regras de bump têm testes em `scripts/bump-versions.test.js`, executados pelo `pnpm test`.

### Branches

Cada entrega é feita em uma branch própria a partir da `main` (ex.: `feat/estrutura-base`) e integrada por PR.

Os finais de linha são normalizados para LF pelo `.gitattributes`, evitando divergências do Biome no Windows.

## Comandos

| Comando               | Finalidade                                                                      |
| --------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`            | Inicia o servidor de desenvolvimento.                                           |
| `pnpm codegen`        | Gera os tipos GraphQL (roda antes de validate, typecheck, test e build).        |
| `pnpm codegen:watch`  | Regenera os tipos ao editar as queries.                                         |
| `pnpm codegen:schema` | Baixa o schema do AniList para `schema.graphql` (manual; commitar o resultado). |
| `pnpm validate`       | Executa formatação, lint, testes unitários e build.                             |
| `pnpm format`         | Formata os arquivos com o Biome.                                                |
| `pnpm test:watch`     | Executa os testes unitários em modo observação (ciclo TDD).                     |
| `pnpm test:coverage`  | Gera cobertura dos testes unitários.                                            |
| `pnpm test:e2e`       | Executa os fluxos no navegador sobre o preview.                                 |
| `pnpm typecheck`      | Verifica os tipos com o TypeScript.                                             |
| `pnpm lighthouse`     | Audita um preview já em execução e aplica as notas mínimas.                     |
| `pnpm lighthouse:ci`  | Sobe o preview, audita e gera `reports/lighthouse.report.*`.                    |
| `pnpm version:bump`   | Calcula e grava a versão (`--dry-run` só mostra).                               |

O Lighthouse usa o Chrome indicado em `CHROME_PATH` ou, na falta dele, o Chromium instalado pelo Playwright. Ele gera relatórios HTML e JSON e falha se alguma categoria ficar abaixo do mínimo definido em `scripts/lighthouse.js`: performance 90, acessibilidade 95 (RNF01), boas práticas 90 e SEO 90. As regras de nota têm testes em `scripts/lighthouse.test.js`.

## Integração contínua (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda em PRs para a `main` (abertura, novos commits e edição do título) e em push na `main`. Os estágios vão do mais barato ao mais caro, e cada um só roda se os anteriores passaram:

```text
1. commits ──┬─> 2. quality ──┬─> 3. test ─> 4. build ─┬─> 5. e2e
             ├─> 2. security ─┤                        └─> 5. lighthouse
             └─> 2. codeql ───┘
```

| Estágio          | Verificações                                                                                                                                                                                                                                                         | Artefato            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1 · Commits (PR) | Commitlint nos commits da branch e no título do PR (que vira o commit do squash); máximo de 30 arquivos por commit (`check-commit-size.js --range`); versão do `package.json` e tipo do título compatíveis com o bump (`bump-versions.js --check` e `--check-title`) | —                   |
| 2 · Qualidade    | Formatação (Biome), tipos GraphQL (`pnpm codegen`), lint e code smells (ESLint + SonarJS), tipos (`tsc`)                                                                                                                                                             | —                   |
| 2 · Segurança    | `pnpm audit` (falha em severidade alta) e Dependency Review nas dependências novas do PR                                                                                                                                                                             | —                   |
| 2 · CodeQL       | Análise estática de segurança de JavaScript/TypeScript e dos workflows (`security-extended`)                                                                                                                                                                         | Alertas no GitHub   |
| 3 · Testes       | `pnpm codegen` + Vitest com cobertura                                                                                                                                                                                                                                | `coverage`          |
| 4 · Build        | `pnpm codegen` + `tsc -b` + `vite build`                                                                                                                                                                                                                             | `dist`              |
| 5 · E2E          | Playwright (Chromium) sobre o `dist` do estágio 4                                                                                                                                                                                                                    | `playwright-report` |
| 5 · Lighthouse   | Auditoria do `dist` com notas mínimas                                                                                                                                                                                                                                | `lighthouse`        |

Decisões do pipeline:
- **Ordem por custo:** convenções e versionamento barram o pipeline antes de instalar navegadores; qualidade e segurança rodam em paralelo; e2e e Lighthouse reaproveitam o mesmo `dist`, garantindo que auditam o artefato testado.
- **Em push na `main`**, o estágio 1 é pulado (o squash já foi validado no PR) e o pipeline começa no estágio 2.
- **Segurança da própria pipeline:** Actions de terceiros fixadas por SHA de commit, permissões mínimas (`contents: read`, `security-events: write` só no CodeQL) e título do PR passado por variável de ambiente, nunca interpolado no script.
- **Reprodutibilidade:** pnpm na versão do campo `packageManager`, `pnpm install --frozen-lockfile` e Node 24 (LTS); a instalação fica na ação composta `.github/actions/setup`.
- **Concorrência:** um novo push no mesmo PR cancela a execução anterior.
- **Tipos GraphQL offline:** o passo "Gerar tipos (GraphQL Codegen)" roda nos jobs que compilam ou testam, a partir do `schema.graphql` versionado, sem acessar o AniList. O `pnpm.overrides` do `package.json` mantém o `@graphql-tools/utils` do preset numa versão corrigida, para o `pnpm audit` passar.
