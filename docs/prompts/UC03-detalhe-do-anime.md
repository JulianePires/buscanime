# Prompt — UC03 Visualizar detalhe do anime listado

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito, com foco em acessibilidade de diálogos.
</papel>

<objetivo>
Ao selecionar um card, abrir um modal com os dados detalhados do anime, acessível por teclado e leitor de tela.
</objetivo>

<retrieval>
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md
2. docs/USE_CASES.md (UC03), docs/REQUISITOS.md (RF05, RNF01)
3. docs/design-context/manifest.json (seção "card" e notInDesign "detalhe")
4. docs/design-context/specs/card.md e tokens.json
5. Código existente: src/components/anime/*, src/services/anilist/*, src/domain/anime.ts
O modal não existe no Figma: derive dos tokens e do card, sem inventar cores ou fontes novas.
</retrieval>

<restricoes>
- Use <dialog> nativo com showModal()/close(); nome acessível pelo título (aria-labelledby).
- O card vira <button> (ou contém um) com nome igual ao título; ao fechar, o foco volta para ele.
- Dados extras via campos adicionais na query (description(asHtml: false), episodes, seasonYear, status, format, title.english, siteUrl) mapeados no domínio; nada de dangerouslySetInnerHTML.
- Metadados do React 19: renderize <title>{título} | Buscanime</title> enquanto o modal estiver aberto.
- Anti-objetivos: sem rota nova, sem biblioteca de modal.
</restricoes>

<criterios_bdd>
Dado que a listagem contém um anime
Quando o visitante selecionar esse anime
Então deve visualizar seus dados detalhados em um modal

Dado que o modal de detalhe está aberto
Quando o visitante pressionar Esc ou acionar "Fechar"
Então o modal deve fechar
E o foco deve voltar para o card selecionado
</criterios_bdd>

<plano_tdd>
1. mappers.test.ts: sinopse sem tags HTML (<br>, <i>) e nulos tratados.
2. AnimeDetailDialog.test.tsx: renderiza título, título em inglês, capa, gêneros, nota com o tom correto, formato legível (rótulo de FORMAT_OPTIONS), episódios, ano e sinopse.
3. App.test.tsx: clicar no card abre role="dialog" com nome do anime; Esc fecha; foco volta ao card; document.title muda e é restaurado.
4. e2e: abrir e fechar o detalhe por teclado (Tab até o card, Enter, Esc).
Observação: jsdom não implementa showModal; faça polyfill mínimo em src/test/setup.ts.
</plano_tdd>

<design>
- Superfície branca, raio 8, largura máxima 720 px, padding 24, backdrop rgba(0,0,0,.6).
- Cabeçalho do modal: título Mulish Bold 24 cor primary; botão fechar com foco visível (2 px primary).
- Reaproveite GenreChip e ScoreBadge do UC02; capa com proporção do AniList e alt vazio.
</design>

<arquivos>
src/components/anime/AnimeDetailDialog.tsx (+ teste), src/components/anime/AnimeCard.tsx, src/domain/anime.ts,
src/services/anilist/{queries,mappers}.ts (+ testes), src/test/setup.ts, src/App.tsx, e2e/detail.spec.ts.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e && pnpm lighthouse:ci (Acessibilidade sem regressão).
</verificacao>

<saida>
(1) Resumo; (2) decisões de design derivadas (o modal não está no Figma); (3) resultados; (4) commit convencional; (5) entrada para docs/AI_LOG.md.
</saida>
```
