# Arquitetura e ferramentas

## Organização

O projeto segue uma arquitetura de frontend orientada a componentes:

```text
src/
├── App.tsx              # Composição da página (cabeçalho, navegação e área principal)
├── App.test.tsx         # Testes de comportamento da página (UC01)
├── App.css              # Ajustes locais que não são utilitários Tailwind
├── index.css            # Tokens globais e importação do Tailwind
├── main.tsx             # Bootstrap da aplicação
└── test/                # Setup compartilhado do Vitest
e2e/                     # Fluxos de usuário com Playwright
scripts/                 # Automações de commit, versão e auditoria
reports/                 # Relatórios gerados (Lighthouse), fora do versionamento
docs/                    # Requisitos, casos de uso, arquitetura e registros do trabalho
```

O Vite faz o bundling e o Tailwind é integrado pelo plugin oficial. O ESLint cuida de problemas semânticos e code smells, o Biome padroniza a escrita e o comando `pnpm validate` funciona como gate local.

## Stack

- React 19 + TypeScript + Vite (com React Compiler via Babel).
- [API GraphQL do AniList](https://docs.anilist.co/) como fonte de dados (busca, formatos, gêneros, nota e capa dos animes).
- Tailwind CSS 4 para estilos utilitários.
- ESLint 10 + `typescript-eslint` + `eslint-plugin-sonarjs` para code smells.
- Biome para formatação, organização de imports e lint complementar.
- Vitest + Testing Library (jsdom) para testes unitários e de integração.
- Playwright (Chromium) para testes end-to-end sobre o build de produção.
- Commitlint + Husky + lint-staged para commits convencionais e checagens antes do commit.
- Lighthouse para auditoria de performance, acessibilidade, boas práticas e SEO.
- Claude Code como ferramenta de apoio ao SDD, BDD, TDD, implementação e documentação.

## Decisões de arquitetura

### React 19

Escolhido pelas novas funcionalidades, que atendem diretamente aos casos de uso:

| Funcionalidade                                | Uso previsto no Buscanime                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `use` + `Suspense`                            | Ler a resposta da busca de animes de forma declarativa, com estados de carregamento explícitos (UC02, RNF06). |
| Transições assíncronas (`useTransition`)      | Manter a interface responsiva ao aplicar filtros de formato e busca por texto (UC04, UC05).                   |
| `useDeferredValue` com valor inicial          | Adiar a atualização da listagem enquanto o usuário digita na busca (UC05).                                    |
| `useOptimistic` / Actions                     | Refletir imediatamente a seleção de filtros antes da resposta dos dados (UC04).                               |
| `ref` como prop                               | Devolver o foco ao primeiro item novo após o "Ver mais", sem `forwardRef` (UC06, RNF01).                      |
| Metadados no componente (`<title>`, `<meta>`) | Atualizar título e descrição ao abrir o detalhe de um anime, favorecendo SEO e acessibilidade (UC03, RNF01).  |

### React Compiler

Escolhido para otimizar a renderização sem memoização manual:

- Memoiza automaticamente componentes, valores derivados e callbacks em tempo de build, dispensando `useMemo`, `useCallback` e `React.memo` escritos à mão.
- Reduz re-renderizações da listagem ao filtrar, buscar e carregar novas páginas pelo "Ver mais" (UC02, UC04 a UC06, RNF02).
- Mantém o código mais simples e legível, alinhado às regras de code smells.
- Configurado no `vite.config.ts` via `@rolldown/plugin-babel` com `reactCompilerPreset()`; o `eslint-plugin-react-hooks` 7 aplica as regras que o compilador exige (pureza de componentes e regras de hooks).
- Memoização manual só deve ser usada quando uma medição mostrar ganho que o compilador não obteve.

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

| Comando              | Finalidade                                                  |
| -------------------- | ----------------------------------------------------------- |
| `pnpm dev`           | Inicia o servidor de desenvolvimento.                       |
| `pnpm validate`      | Executa formatação, lint, testes unitários e build.         |
| `pnpm format`        | Formata os arquivos com o Biome.                            |
| `pnpm test:watch`    | Executa os testes unitários em modo observação (ciclo TDD). |
| `pnpm test:coverage` | Gera cobertura dos testes unitários.                        |
| `pnpm test:e2e`      | Executa os fluxos no navegador sobre o preview.             |
| `pnpm lighthouse`    | Audita um preview já em execução.                           |
| `pnpm lighthouse:ci` | Sobe o preview, audita e gera `reports/lighthouse.html`.    |
| `pnpm version:bump`  | Calcula e grava a versão (`--dry-run` só mostra).           |

O Lighthouse usa o Chrome indicado em `CHROME_PATH` ou, na falta dele, o Chromium instalado pelo Playwright.
