# Base de contexto de design (RAG)

Snapshot versionado do [Figma do desafio](https://www.figma.com/design/uHjhK532Aq0D6L4teYX6bz/INSTITUCIONAL----DesafioWinnin--Copy-?node-id=0-1), organizado para ser **recuperado** pela IA antes de implementar cada caso de uso. A decisão e suas consequências estão em [ADR-001](../adr/ADR-001-base-de-contexto-de-design-rag.md).

## Conteúdo

```text
docs/design-context/
├── README.md                 # Este índice e as regras de consulta
├── manifest.json             # Índice: seção → nó do Figma → UC → spec → referência → assets
├── tokens.json               # Cores, tipografia, raios, tamanhos, espaçamentos e efeitos
├── specs/                    # Um chunk por seção (fonte primária para implementar)
│   ├── layout.md
│   ├── header.md
│   ├── filtros.md
│   ├── busca.md
│   ├── card.md
│   ├── ver-mais.md
│   └── footer.md
├── references/               # Renders do Figma (alvo visual; nunca usar como asset)
├── fixtures/figma-cards.json # Dados dos 12 cards (título, gêneros, nota, cor esperada)
└── source/                   # Saída bruta do get_design_context (último recurso)
public/
├── brand/logo.svg            # Logo BUSCANIME em contorno (header e footer)
└── icons/add.svg             # Ícone "+" do botão "Ver mais"
```

## Regras de consulta (retrieval)

1. **Comece pelo `manifest.json`**: filtre as seções pelo caso de uso (`useCases`) e abra só os arquivos listados.
2. **Ordem de autoridade**: regras de negócio em `docs/` (`REQUISITOS.md`, `USE_CASES.md`, `DESIGN.md`) > `specs/*.md` > `tokens.json` > `references/*.png` > `source/*.txt`. Exemplo: a cor da nota segue a regra, não o card de 80% do Figma.
3. **Alvo visual**: compare a implementação com `references/<seção>.png`; a imagem nunca entra no código.
4. **Assets**: use apenas os de `public/`, nas posições indicadas pela spec, sem alterar `width`/`height` do SVG.
5. **Figma ao vivo só por exceção**: consulte o Figma MCP apenas se a informação não existir aqui ou se o design mudar. Nesse caso, atualize a base no mesmo PR (veja abaixo).
6. **Lacunas do design** (`manifest.json → notInDesign`): derive dos tokens, registre a decisão no `AI_LOG.md` e, se for recorrente, em uma spec nova.

## Como regenerar

Com o Figma MCP conectado ao arquivo `uHjhK532Aq0D6L4teYX6bz`:

1. `get_metadata` no frame `3396:64` para conferir os ids do `manifest.json`.
2. `get_screenshot` de cada nó listado em `sections[].figmaNode` → `references/<id>.png`.
3. `get_design_context` no nó `3398:724` → `source/desktop-frame.figma.tsx.txt` (trocar as URLs temporárias por placeholders).
4. `use_figma` somente leitura com `node.exportAsync({ format: "SVG", svgOutlineText: true })` nos nós `3406:248` (logo) e `3396:80` (ícone) → `public/`.
5. Atualizar `extractedAt` no `manifest.json` e registrar a mudança no `CHANGELOG.md`.

## Fora da base, de propósito

- **Capas dos cards**: são arte de terceiros e vêm do AniList em tempo de execução (`coverImage.extraLarge`). Os renders em `references/` as contêm apenas como referência visual.
- **Fonte Mulish**: será instalada como dependência (`@fontsource-variable/mulish`) no UC01, não copiada para o repositório.
