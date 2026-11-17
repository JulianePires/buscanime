import { screen, within } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { clickAndWait, renderWithCatalog } from "../../test/apollo";
import { zom100Card } from "../../test/fixtures/anime";
import { buildDetailData } from "../../test/fixtures/anime-page";
import { anilist } from "../../test/msw/handlers";
import { server } from "../../test/msw/server";
import { AnimeDetail } from "./AnimeDetail";

const SYNOPSIS = "Sinopse completa.";

const serverError = (): Response => new HttpResponse("Internal Server Error", { status: 500 });

function detailApi({ failFirst = false } = {}) {
  let calls = 0;
  server.use(
    anilist.query("AnimeDetail", async ({ variables }) => {
      calls += 1;
      await delay(100);
      if (failFirst && calls === 1) return serverError();
      return HttpResponse.json({
        data: buildDetailData(Number(variables.id), { description: SYNOPSIS }),
      });
    }),
  );
  return () => calls;
}

async function renderDetail() {
  const onClose = vi.fn();
  await renderWithCatalog(<AnimeDetail anime={zom100Card} onClose={onClose} />);
  return { dialog: screen.getByRole("dialog", { name: zom100Card.title }), onClose };
}

describe("AnimeDetail (modal com consulta própria, UC08)", () => {
  it("abre na hora com o resumo do card e um carregamento no lugar do corpo", async () => {
    detailApi();
    const { dialog } = await renderDetail();

    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText(zom100Card.englishTitle ?? "")).toBeInTheDocument();
    expect(within(dialog).getByRole("presentation")).toHaveAttribute("src", zom100Card.coverUrl);
    expect(within(dialog).getByRole("list", { name: "Gêneros" })).toBeInTheDocument();
    expect(within(dialog).getByText("80%")).toBeInTheDocument();
    expect(within(dialog).getByRole("status")).toHaveTextContent("Carregando detalhes");
    expect(document.title).toBe(`${zom100Card.title} | Buscanime`);

    expect(await within(dialog).findByText(SYNOPSIS)).toBeInTheDocument();
    expect(within(dialog).queryByRole("status")).not.toBeInTheDocument();
    expect(within(dialog).getByText("TV Show")).toBeInTheDocument();
  });

  it("com erro, mostra a falha dentro do modal e tenta de novo", async () => {
    const calls = detailApi({ failFirst: true });
    const { dialog, onClose } = await renderDetail();

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível carregar os detalhes.");
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent(zom100Card.title);

    await clickAndWait(within(alert).getByRole("button", { name: "Tentar novamente" }));

    expect(await within(dialog).findByText(SYNOPSIS)).toBeInTheDocument();
    expect(calls()).toBe(2);
    expect(onClose).not.toHaveBeenCalled();
  });
});
