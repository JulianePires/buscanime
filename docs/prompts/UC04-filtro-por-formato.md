# Prompt — UC04 Filtrar lista por um ou mais formatos

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito; regras como dados, estado dos filtros em reducer puro; estado do servidor no TanStack Query (ADR-002).
</papel>

<objetivo>
Permitir selecionar um ou mais formatos (TV Show, Movie, TV Short, Special, OVA, ONA, Music) e listar apenas animes compatíveis, com "All Formats" limpando a seleção.
</objetivo>

<retrieval>
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md
2. docs/USE_CASES.md (UC04), docs/REQUISITOS.md (RF03)
3. docs/design-context/manifest.json (seção "filtros")
4. docs/design-context/specs/filtros.md e tokens.json
5. Alvo visual: docs/design-context/references/filtros.png
6. Código existente: src/features/catalog/*, src/services/anilist/*
</retrieval>

<restricoes>
- src/domain/formats.ts exporta FORMAT_OPTIONS (rótulo ↔ MediaFormat) como única fonte; nada de strings repetidas.
- Reducer (catalog-filters-reducer): ações toggleFormat(format) e clearFormats(); qualquer mudança gera nova queryKey, que recomeça na página 1.
- Repositório envia format_in somente quando há seleção (null remove o filtro no AniList).
- Aplique a mudança com useTransition (a lista anterior fica visível enquanto a nova chave carrega); o cancelamento vem do signal do queryFn repassado ao repositório.
- Acessibilidade: role="group" com nome "Formato", botões com aria-pressed.
- Anti-objetivos: sem busca por texto e sem persistência em URL neste UC.
</restricoes>

<criterios_bdd>
Dado que existem animes de formatos diferentes
Quando o visitante selecionar um ou mais formatos
Então a listagem deve exibir somente os animes compatíveis

Dado que há formatos selecionados
Quando o visitante acionar "All Formats"
Então a seleção deve ser limpa
E a listagem deve exibir animes de todos os formatos
</criterios_bdd>

<plano_tdd>
1. formats.test.ts: 8 opções na ordem do design; "All Formats" sem valor; demais mapeiam para TV, MOVIE, TV_SHORT, SPECIAL, OVA, ONA, MUSIC.
2. catalog-filters-reducer.test.ts: toggle adiciona e remove; clear esvazia; a queryKey muda em ambos.
3. anime-repository.test.ts (msw): format_in ausente sem seleção; ["TV","MOVIE"] com duas seleções.
4. FormatFilter.test.tsx: "All Formats" com aria-pressed=true sem seleção; clicar em "Movie" marca Movie e desmarca All Formats; clicar de novo desmarca.
5. App.test.tsx (msw): selecionar "Movie" renderiza só itens MOVIE do handler.
6. e2e: selecionar dois formatos e verificar o corpo da requisição interceptada.
</plano_tdd>

<design>
- Botões: altura 32, raio 4, Mulish SemiBold 14, gap 19, linha centralizada (quebra em telas estreitas).
- Ativo: fundo #6324C6, texto branco. Inativo: fundo branco, borda 1 px #6324C6, texto #6324C6.
- Hover (derivado): fundo #774DC5 a 10%. Foco: contorno 2 px #6324C6, offset 2.
</design>

<arquivos>
src/domain/formats.ts (+ teste), src/features/catalog/{catalog-filters-reducer,use-catalog}.ts (+ testes),
src/services/anilist/{queries,anime-repository}.ts (+ testes), src/components/filters/FormatFilter.tsx (+ teste), src/App.tsx, e2e/filters.spec.ts.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e. Compare a linha de filtros com references/filtros.png em 1366 px.
</verificacao>

<saida>
(1) Resumo; (2) divergências do Figma; (3) resultados; (4) commit convencional (ex.: "feat: filter anime list by format"); (5) entrada para docs/AI_LOG.md.
</saida>
```
