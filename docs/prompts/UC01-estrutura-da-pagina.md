# Prompt — UC01 Visualizar estrutura da página

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime (React 19 + TypeScript + Vite + Tailwind 4 + React Compiler). Trabalhe em TDD estrito: teste vermelho, menor implementação, refatoração com a suíte verde.
</papel>

<objetivo>
Entregar a estrutura fiel ao Figma: header roxo com o logo, área principal e footer com logo e legenda, usando os tokens do design como única fonte de estilo.
</objetivo>

<retrieval>
Leia, nesta ordem, antes de editar qualquer arquivo:
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md (regras de consulta)
2. docs/USE_CASES.md (UC01) e docs/REQUISITOS.md (RF01, RF08, RNF01, RNF05)
3. docs/design-context/manifest.json (seções com "UC01")
4. docs/design-context/specs/layout.md, specs/header.md, specs/footer.md
5. docs/design-context/tokens.json
6. Compare visualmente com docs/design-context/references/header.png, footer.png e desktop-frame.png
Não consulte o Figma ao vivo; se faltar algo, pare e liste o que falta.
</retrieval>

<restricoes>
- Tokens no `@theme` do Tailwind em src/index.css com os nomes de tokens.json (ex.: --color-primary, --color-warning, --font-sans, --radius-control, --radius-card).
- Fonte: instale @fontsource-variable/mulish e importe em src/main.tsx. Remova Inter e as cores provisórias (fuchsia, slate).
- Logo: use public/brand/logo.svg como <img>, sem alterar width/height; nome acessível no link ("Buscanime").
- Componentes de apresentação em src/components/layout/: SiteHeader, SiteFooter, Logo. App.tsx só compõe.
- Sem useMemo/useCallback/React.memo manuais; sem any; regras de smells do ESLint devem passar.
- Anti-objetivos: não criar filtros, busca, cards nem chamadas à API.
</restricoes>

<criterios_bdd>
Dado que o visitante acessou a aplicação
Quando a página terminar de carregar
Então deve visualizar a navegação, o título principal e a área de conteúdo
E o cabeçalho deve exibir o logo Buscanime com link para a página inicial
E o rodapé deve exibir o logo e "TODOS OS DIREITOS RESERVADOS"
</criterios_bdd>

<plano_tdd>
1. src/App.test.tsx: link "Buscanime" na navegação principal contém <img> com src "/brand/logo.svg" (ajuste o teste existente).
2. src/App.test.tsx: existe contentinfo com o texto "TODOS OS DIREITOS RESERVADOS" e o logo.
3. src/App.test.tsx: ordem banner → main → contentinfo.
4. src/design-tokens.test.ts: cada cor de docs/design-context/tokens.json existe como --color-<nome> em src/index.css com o mesmo valor (lê os arquivos com node:fs).
5. e2e/home.spec.ts: header com altura 68 px e fundo rgb(99, 36, 198); footer com altura 54 px; sem rolagem horizontal em 375 px.
</plano_tdd>

<design>
- Header: 68 px, fundo primary #6324C6, logo 231 × 29 centralizado.
- Footer: 54 px, fundo primary, logo escalado para 139 × 18, legenda Mulish Regular 10 px branca, padding-top 10.
- Página: fundo branco, coluna com gap de 24 px entre seções, conteúdo até 1316 px com gutter de 25 px (16 px abaixo de 640 px).
</design>

<arquivos>
src/index.css, src/main.tsx, src/App.tsx, src/App.test.tsx, src/design-tokens.test.ts,
src/components/layout/{SiteHeader,SiteFooter,Logo}.tsx, e2e/home.spec.ts, package.json.
Remover src/App.css e src/assets/react.svg se não forem mais usados.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e && pnpm lighthouse:ci
Abra o preview em 1366 px e compare com references/header.png e references/footer.png.
</verificacao>

<saida>
Responda com: (1) resumo do que mudou; (2) divergências em relação ao Figma e por quê; (3) resultado dos comandos; (4) mensagem de commit convencional (ex.: "feat: build page structure from design tokens"); (5) entrada para docs/AI_LOG.md no formato de "Registro de alterações".
</saida>
```
