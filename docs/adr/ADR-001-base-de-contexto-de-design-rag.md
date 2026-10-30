# ADR-001 — Base de contexto de design versionada (RAG) para o desenvolvimento assistido por IA

- **Status:** aceita
- **Data:** 2026-10-30
- **Contexto de decisão:** implementação dos casos de uso UC01 a UC06 com Claude Code, a partir do Figma do desafio.

## Contexto

O Figma é a fonte da verdade visual, mas consultá-lo a cada ciclo TDD tem custos:

- **Tokens e latência:** o `get_design_context` do frame inteiro devolve ~64 mil caracteres; repetir isso a cada UC consome contexto que deveria ir para código e testes.
- **Fidelidade instável:** o código gerado pelo Figma usa posições absolutas e larguras fixas; sem curadoria, a IA tende a copiá-lo literalmente.
- **URLs efêmeras:** os assets do MCP expiram em 7 dias, o que quebra a reprodutibilidade.
- **Divergências não registradas:** o design contradiz regras de negócio (nota 80 em verde) e omite estados, detalhe e mobile.
- **Dependência de acesso:** quem clona o repositório (ou a CI) nem sempre tem acesso ao arquivo do Figma.

## Decisão

Adotar uma **base de contexto de design local e versionada** em `docs/design-context/`, consultada por recuperação (Retrieval-Augmented Generation) antes de cada implementação:

1. **Assets exportados** para `public/` (logo e ícone em SVG, extraídos por `exportAsync` do próprio nó, com texto convertido em contorno).
2. **Chunks semânticos por seção** (`specs/*.md`), cada um pequeno, autocontido e ligado a nó do Figma, caso de uso, referência visual e assets.
3. **Índice** (`manifest.json`) que permite recuperar só o necessário para cada UC.
4. **Tokens estruturados** (`tokens.json`) como fonte única dos valores, espelhados em `src/index.css` (`@theme` do Tailwind).
5. **Referências visuais** (`references/*.png`) usadas como alvo de comparação, nunca como asset.
6. **Fixtures** com os dados do design, reaproveitadas nos testes (BDD/TDD).
7. **Ordem de autoridade** explícita: regras de negócio > specs > tokens > referências > código bruto do Figma.
8. **Prompts por UC** (`docs/prompts/`) que obrigam a etapa de retrieval e citam os chunks exatos.

O retrieval é **determinístico** (arquivos nomeados por seção e indexados por UC), não vetorial: com ~15 documentos, embeddings acrescentariam infraestrutura sem ganho de precisão.

## Alternativas consideradas

| Alternativa                       | Motivo da rejeição                                                               |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Consultar o Figma MCP a cada UC   | Custo de tokens, URLs efêmeras, depende de acesso ao Figma.                      |
| Só o `DESIGN.md`                  | Resumo útil para pessoas, mas sem granularidade por componente nem assets.       |
| RAG vetorial (embeddings + busca) | Overengineering para o volume atual; resultados menos previsíveis.               |
| Code Connect                      | Exige plano Organization/Enterprise no Figma e não há biblioteca de componentes. |

## Consequências

**Positivas**

- Implementação mais fiel: cada prompt recebe medidas, estados e assets exatos da seção.
- Menos tokens por ciclo: um UC carrega 1 a 3 chunks (~1–3 KB) em vez do frame inteiro (~64 KB).
- Reprodutível offline e na CI; revisável em PR como qualquer código.
- Divergências e lacunas do design ficam documentadas, não decididas implicitamente pela IA.

**Negativas e mitigação**

- **Risco de desatualização** em relação ao Figma → `extractedAt` no manifesto, procedimento de regeneração no README da base e regra de atualizar a base no mesmo PR que mudar o design.
- **Duplicação de tokens** (`tokens.json` e CSS) → o CSS é a implementação; o JSON é a referência. Um teste no UC01 compara os dois.
- **Peso no repositório** (~2 MB de PNGs de referência) → aceito; são arquivos estáveis e fora do bundle.

## Referências

- Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) (2020).
- Michael Nygard, [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (2011).
- [Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/).
