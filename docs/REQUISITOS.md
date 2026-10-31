# Requisitos

## Requisitos funcionais (RF)

- **RF01 — Navegação:** o usuário pode navegar pela página e acessar a listagem, os filtros e os detalhes.
- **RF02 — Listagem:** o sistema deve exibir uma listagem de animes com informações resumidas.
- **RF03 — Filtro por formato:** o usuário pode filtrar a listagem por um ou mais formatos.
- **RF04 — Busca por texto:** o usuário pode buscar animes por texto.
- **RF05 — Detalhes:** o usuário pode selecionar um anime listado e visualizar seus detalhes.
- **RF06 — Paginação por "Ver mais":** o sistema deve carregar a próxima página de itens quando o usuário acionar o botão "Ver mais", ao final da listagem.
- **RF08 — Responsividade:** o conteúdo e os controles devem funcionar em dispositivos móveis e desktop.

O RF07 (tamanho da paginação) foi removido: não consta no Figma; o tamanho da página segue a largura da tela (3 itens até 600 px, 6 até 919 px, 9 até 1219 px e 12 a partir de 1220 px, em `src/domain/page-size.ts`). A numeração foi mantida para não quebrar as referências ao RF08.

## Requisitos não funcionais (RNF)

- **RNF01 — Acessibilidade:** usar HTML semântico, foco visível, labels e nomes acessíveis em controles.
- **RNF02 — Performance:** evitar carregamentos desnecessários e monitorar a experiência com Lighthouse.
- **RNF03 — Qualidade:** código deve passar por TypeScript, ESLint, Biome e testes automatizados.
- **RNF04 — Compatibilidade:** suportar os navegadores modernos cobertos pelo Playwright.
- **RNF05 — Manutenibilidade:** manter componentes, configurações, documentação e testes em locais previsíveis.
- **RNF06 — Feedback:** representar estados de carregamento, vazio e erro de forma explícita.
