# Prompt — UC05 Filtrar lista por busca de texto

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito, reaproveitando o estado do catálogo criado no UC04.
</papel>

<objetivo>
Buscar animes por texto pelo campo "Digite algo aqui..." e pelo botão "Buscar", combinando o termo com os formatos selecionados.
</objetivo>

<retrieval>
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md
2. docs/USE_CASES.md (UC05), docs/REQUISITOS.md (RF04, RNF06)
3. docs/design-context/manifest.json (seção "busca")
4. docs/design-context/specs/busca.md e tokens.json
5. Alvo visual: docs/design-context/references/busca.png
6. Código existente: src/features/catalog/*, src/components/filters/*
</retrieval>

<restricoes>
- form role="search" com label visualmente oculto "Buscar anime" e input type="search" não controlado (defaultValue do termo atual), lido com FormData no onSubmit + preventDefault. Não usar <form action>: o React 19 reseta campos não controlados após a action. Sem React Hook Form (ADR-002).
- A busca dispara no submit (botão ou Enter), não a cada tecla: uma requisição por intenção do usuário.
- Termo normalizado no domínio (trim; vazio remove o filtro). Reducer de filtros: ação search(term) gera nova queryKey (página 1).
- Ordenação: SEARCH_MATCH com termo; POPULARITY_DESC sem termo.
- Estado vazio informa o termo: "Nenhum anime encontrado para "<termo>"".
- Anti-objetivos: sem autocomplete e sem debounce de digitação.
</restricoes>

<criterios_bdd>
Dado que existem animes cadastrados
Quando o visitante informar um texto de busca
Então a listagem deve exibir os animes correspondentes ao texto

Dado que há formatos selecionados
Quando o visitante buscar por um texto
Então a listagem deve respeitar o texto e os formatos ao mesmo tempo

Dado que nenhum anime corresponde ao texto
Quando a busca terminar
Então deve exibir a mensagem de lista vazia com o termo pesquisado
</criterios_bdd>

<plano_tdd>
1. domain: normalizeSearch("  naruto ") → "naruto"; "   " → undefined.
2. catalog-filters-reducer.test.ts: search define o termo e mantém os formatos.
3. anime-repository.test.ts (msw): search + sort SEARCH_MATCH com termo; sem search e com POPULARITY_DESC sem termo; format_in combinado.
4. SearchBar.test.tsx: label acessível; submit pelo botão e por Enter chama onSearch uma vez com o termo.
5. App.test.tsx (msw): busca "one piece" lista o resultado; termo sem resultados exibe o vazio com o termo.
6. e2e: digitar, pressionar Enter e verificar a requisição e os cards.
</plano_tdd>

<design>
- Conjunto até 1012 px, centralizado, gap 10.
- Campo: altura 38, borda 1 px #C4CAD4, raio 4, padding-left 10, Mulish Regular 14, placeholder #A7B0BE. Foco: borda #6324C6.
- Botão "Buscar": 86 × 38, fundo #6324C6, texto branco SemiBold 14, raio 4.
</design>

<arquivos>
src/domain/search.ts (+ teste), src/features/catalog/* (+ testes), src/services/anilist/* (+ testes),
src/components/filters/SearchBar.tsx (+ teste), src/components/feedback/EmptyState.tsx, src/App.tsx, e2e/search.spec.ts.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e. Compare com references/busca.png em 1366 px.
</verificacao>

<saida>
(1) Resumo; (2) divergências do Figma; (3) resultados; (4) commit convencional (ex.: "feat: search anime by text"); (5) entrada para docs/AI_LOG.md.
</saida>
```
