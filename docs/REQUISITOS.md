# Requisitos

## Requisitos funcionais (RF)

- **RF01 — Navegação:** o usuário pode navegar pela página e acessar a listagem, os filtros e os detalhes.
- **RF02 — Listagem:** o sistema deve exibir uma listagem de animes com informações resumidas.
- **RF03 — Filtro por formato:** o usuário pode filtrar a listagem por um ou mais formatos.
- **RF04 — Busca por texto:** o usuário pode buscar animes por texto.
- **RF05 — Detalhes:** o usuário pode selecionar um anime listado e visualizar seus detalhes.
- **RF06 — Paginação por scroll:** o sistema deve carregar mais itens conforme o usuário avança no scroll infinito.
- **RF07 — Tamanho da paginação:** o usuário pode alterar a quantidade de itens carregados por página.
- **RF08 — Responsividade:** o conteúdo e os controles devem funcionar em dispositivos móveis e desktop.

## Requisitos não funcionais (RNF)

- **RNF01 — Acessibilidade:** usar HTML semântico, foco visível, labels e nomes acessíveis em controles.
- **RNF02 — Performance:** evitar carregamentos desnecessários e monitorar a experiência com Lighthouse.
- **RNF03 — Qualidade:** código deve passar por TypeScript, ESLint, Biome e testes automatizados.
- **RNF04 — Compatibilidade:** suportar os navegadores modernos cobertos pelo Playwright.
- **RNF05 — Manutenibilidade:** manter componentes, configurações, documentação e testes em locais previsíveis.
- **RNF06 — Feedback:** representar estados de carregamento, vazio e erro de forma explícita.
