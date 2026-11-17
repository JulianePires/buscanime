import { act, fireEvent, screen, within } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { clickAndWait, renderWithCatalog } from "./test/apollo";
import { buildDetailData, buildPageData } from "./test/fixtures/anime-page";
import { anilist } from "./test/msw/handlers";
import { server } from "./test/msw/server";

/** Campos que só o modal mostra: não podem sair na consulta da listagem (ADR-004). */
const DETAIL_ONLY_FIELDS = ["format", "description", "episodes", "seasonYear", "status", "siteUrl"];

// Tipado como Response: o handler GraphQL do msw só aceita corpo JSON no HttpResponse
const SYNOPSIS_2 = "Sinopse do anime 2.";

const serverError = (): Response => new HttpResponse("Internal Server Error", { status: 500 });

/** Listagem com três animes e detalhe com atraso; registra as consultas de cada operação. */
function anilistApi({ detailDelay = 20, failFirstDetail = false } = {}) {
  const api = { pageQueries: [] as string[], detailIds: [] as number[] };
  server.use(
    anilist.query("AnimePage", ({ query }) => {
      api.pageQueries.push(query);
      return HttpResponse.json({ data: buildPageData({ ids: [1, 2, 3] }) });
    }),
    anilist.query("AnimeDetail", async ({ variables }) => {
      api.detailIds.push(Number(variables.id));
      await delay(detailDelay);
      if (failFirstDetail && api.detailIds.length === 1) return serverError();
      return HttpResponse.json({ data: buildDetailData(Number(variables.id)) });
    }),
  );
  return api;
}

/** Primeira palavra de cada linha do `media` da consulta: os campos, sem os argumentos (`format_in`). */
function selectedFields(query: string) {
  const selection = query.slice(query.indexOf("media("));
  return selection.split("\n").map((line) => line.trim().split(/[\s({]/, 1)[0]);
}

async function openDetail(title: string) {
  const card = await screen.findByRole("button", { name: title });
  await clickAndWait(card);
  return { card, dialog: screen.getByRole("dialog", { name: title }) };
}

describe("UC08 - Carregar o detalhe do anime sob demanda", () => {
  beforeEach(() => {
    document.title = "Buscanime | Busca de animes";
  });

  describe("Dado que a listagem de animes foi carregada", () => {
    describe("Quando a consulta da listagem for enviada", () => {
      it("Então ela deve pedir apenas os campos exibidos no card", async () => {
        const api = anilistApi();
        await renderWithCatalog(<App />);
        await screen.findByText("Anime 1");

        expect(api.pageQueries).toHaveLength(1);
        const fields = selectedFields(api.pageQueries[0]);
        expect(fields).toEqual(expect.arrayContaining(["id", "title", "coverImage", "genres"]));
        for (const field of DETAIL_ONLY_FIELDS) expect(fields).not.toContain(field);
        expect(api.detailIds).toEqual([]);
      });
    });
  });

  describe("Dado que a listagem contém um anime", () => {
    describe("Quando o visitante abrir o detalhe desse anime", () => {
      it("Então o modal deve abrir imediatamente com o título, a capa, os gêneros e a nota do card E os dados complementares devem ser buscados em uma consulta própria pelo id do anime E um estado de carregamento deve ocupar o lugar dos dados complementares", async () => {
        const api = anilistApi({ detailDelay: 50 });
        await renderWithCatalog(<App />);
        const { dialog } = await openDetail("Anime 2");

        expect(dialog).toHaveAttribute("open");
        expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent("Anime 2");
        expect(within(dialog).getByRole("presentation")).toHaveAttribute(
          "src",
          "https://img.anili.st/media/2.jpg",
        );
        expect(within(dialog).getByRole("list", { name: "Gêneros" })).toBeInTheDocument();
        expect(within(dialog).getByText("80%")).toBeInTheDocument();
        expect(within(dialog).getByRole("status")).toHaveTextContent("Carregando detalhes");
        expect(within(dialog).queryByText(SYNOPSIS_2)).not.toBeInTheDocument();

        expect(await within(dialog).findByText(SYNOPSIS_2)).toBeInTheDocument();
        expect(within(dialog).getByText("TV Show")).toBeInTheDocument();
        expect(api.detailIds).toEqual([2]);
      });
    });
  });

  describe("Dado que o detalhe de um anime já foi aberto", () => {
    describe("Quando o visitante fechar e abrir de novo o detalhe do mesmo anime", () => {
      it("Então os dados complementares devem aparecer sem nova consulta", async () => {
        const api = anilistApi();
        await renderWithCatalog(<App />);
        const first = await openDetail("Anime 2");
        await within(first.dialog).findByText(SYNOPSIS_2);
        fireEvent.keyDown(first.dialog, { key: "Escape" });

        const { dialog } = await openDetail("Anime 2");
        await act(() => delay(30));

        expect(within(dialog).getByText(SYNOPSIS_2)).toBeInTheDocument();
        expect(within(dialog).queryByRole("status")).not.toBeInTheDocument();
        expect(api.detailIds).toEqual([2]);
      });
    });
  });

  describe("Dado que a consulta do detalhe falhou", () => {
    // O React registra no console todo erro capturado por um boundary
    beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => undefined));
    afterEach(() => vi.restoreAllMocks());

    describe("Quando o modal for exibido", () => {
      it('Então deve mostrar uma mensagem de erro com a opção "Tentar novamente" dentro do modal E a listagem deve continuar visível e inalterada E ao acionar "Tentar novamente" a consulta do detalhe deve ser refeita', async () => {
        const api = anilistApi({ failFirstDetail: true });
        await renderWithCatalog(<App />);
        const { dialog } = await openDetail("Anime 3");

        const alert = await within(dialog).findByRole("alert");
        expect(alert).toHaveTextContent("Não foi possível carregar os detalhes.");
        const list = screen.getByRole("list", { name: "Animes", hidden: true });
        expect(within(list).getAllByRole("article", { hidden: true })).toHaveLength(3);
        expect(api.pageQueries).toHaveLength(1);

        await clickAndWait(within(alert).getByRole("button", { name: "Tentar novamente" }));

        expect(await within(dialog).findByText("Sinopse do anime 3.")).toBeInTheDocument();
        expect(api.detailIds).toEqual([3, 3]);
      });
    });
  });
});
