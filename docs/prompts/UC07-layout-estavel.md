# Prompt — UC07 Usar a página com layout estável

```xml
<papel>
Você é um engenheiro frontend sênior no projeto Buscanime. Trabalhe em TDD estrito, preferindo a plataforma (CSS e <dialog> nativo) a JavaScript e bibliotecas.
</papel>

<objetivo>
Manter o rodapé no final da janela quando o conteúdo for curto, fechar o detalhe ao clicar no overlay e impedir a rolagem da página de fundo enquanto o modal estiver aberto.
</objetivo>

<retrieval>
1. docs/adr/ADR-001-base-de-contexto-de-design-rag.md
2. docs/USE_CASES.md (UC07 e UC03), docs/REQUISITOS.md (RF05, RF08, RNF01, RNF04)
3. docs/design-context/specs/layout.md e specs/footer.md ("o footer não é fixo")
4. docs/prompts/UC03-detalhe-do-anime.md (decisões do modal)
5. Código existente: src/App.tsx, src/components/layout/SiteFooter.tsx, src/components/anime/AnimeDetailDialog.tsx (+ teste), src/components/anime/AnimeGrid.tsx, src/index.css, src/test/setup.ts (polyfill do <dialog>)
6. MDN: <dialog> e HTMLDialogElement.closedBy (não é Baseline), :modal (Baseline) e :has()
</retrieval>

<restricoes>
- Rodapé: "fixar no final da página" é sticky footer, não position: fixed. O layout.md diz que o footer não é fixo; ele só encosta no fim da janela quando o conteúdo é mais curto que ela. Use min-h-dvh na coluna da página e faça o <main> crescer (flex-1). Atualize layout.md e footer.md.
- Overlay: closedby="any" não é Baseline, então o fechamento é manual. O clique no ::backdrop tem como alvo o próprio <dialog>; para isso funcionar, o padding sai do <dialog> e vai para um wrapper interno, que preenche toda a superfície.
- Feche só quando o pointerdown e o click acontecerem no <dialog>: arrastar uma seleção de texto de dentro para fora não pode fechar o modal.
- O fechamento pelo overlay usa dialog.close(), o mesmo caminho de "Fechar" e Esc: onClose, foco de volta ao card e <title> restaurado continuam vindo do UC03.
- Scroll: só CSS, em src/index.css: html:has(dialog:modal) { overflow: hidden }, scrollbar-gutter: stable no html para a largura não pular quando a barra some e overscroll-behavior: contain no <dialog>. Nada de efeito em JS mexendo em document.body.style.
- Anti-objetivos: sem biblioteca de modal, sem position: fixed no rodapé, sem mudar medidas do Figma (rodapé de 54 px, modal de 720 px com padding 24).
</restricoes>

<criterios_bdd>
Dado que o conteúdo da página é menor que a altura da janela
Quando a página for exibida
Então o rodapé deve ficar encostado no final da janela

Dado que o conteúdo da página é maior que a altura da janela
Quando o visitante rolar até o fim
Então o rodapé deve aparecer depois do conteúdo, sem sobrepô-lo

Dado que o modal de detalhe está aberto
Quando o visitante clicar no overlay, fora do conteúdo do modal
Então o modal deve fechar
E o foco deve voltar para o card selecionado

Dado que o modal de detalhe está aberto
Quando o visitante clicar dentro do conteúdo do modal
Então o modal deve continuar aberto

Dado que o modal de detalhe está aberto
Quando o visitante tentar rolar a página
Então a página de fundo não deve rolar
E ao fechar o modal a rolagem deve voltar a funcionar na mesma posição
</criterios_bdd>

<plano_tdd>
1. AnimeDetailDialog.test.tsx: pointerdown + click no <dialog> (overlay) fecha e chama onClose; clique no conteúdo não fecha; pointerdown no conteúdo + click no <dialog> (arrasto) não fecha.
2. App.test.tsx (renderWithCatalog): no bloco do UC03, o overlay entra como mais uma forma de fechar; o foco volta ao card e o título é restaurado.
3. e2e/layout.spec.ts: janela de 1366 × 2400 deixa o rodapé no fim da janela; a 1366 × 900 o rodapé vem depois do "main" e só aparece após rolar; clique em (10, 10) com o modal aberto fecha; clique no título não fecha; com o modal aberto, mouse.wheel não muda o scrollY; depois de fechar, a rolagem volta a funcionar a partir da mesma posição.
4. e2e/detail.spec.ts: o padding de 24 px agora é medido no wrapper interno; a largura de 720 px continua no <dialog>.
Observação: jsdom não aplica o CSS do Tailwind; rodapé e scroll só são verificáveis no Playwright.
</plano_tdd>

<design>
- Rodapé: 54 px, primary, sem mudanças visuais (footer.md). Só a posição muda quando sobra espaço.
- Modal: superfície branca, raio 8, largura máxima 720, padding 24 (agora no wrapper interno), backdrop rgba(0,0,0,.6).
- Sem salto de layout ao abrir o modal: a calha da barra de rolagem continua reservada.
</design>

<arquivos>
src/App.tsx, src/index.css, src/components/anime/AnimeDetailDialog.tsx (+ teste), src/App.test.tsx,
e2e/layout.spec.ts, e2e/detail.spec.ts, docs/design-context/specs/{layout,footer}.md.
</arquivos>

<verificacao>
pnpm validate && pnpm test:e2e && pnpm lighthouse:ci (Acessibilidade sem regressão). A feature só está pronta com todos verdes.
</verificacao>

<saida>
(1) Resumo; (2) decisões (sticky em vez de fixo, fechamento manual em vez de closedby, scroll travado só com CSS); (3) resultados; (4) commit convencional (ex.: "fix: keep footer at page bottom and close dialog on backdrop"); (5) entrada para docs/AI_LOG.md.
</saida>
```
