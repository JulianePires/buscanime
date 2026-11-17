import { act, screen } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { Suspense, useState } from "react";
import { describe, expect, it } from "vitest";
import { ErrorBoundary } from "../../components/feedback/ErrorBoundary";
import { clickAndWait, renderWithCatalog } from "../../test/apollo";
import { buildDetailData } from "../../test/fixtures/anime-page";
import { anilist } from "../../test/msw/handlers";
import { server } from "../../test/msw/server";
import { useAnimeDetail } from "./use-anime-detail";

// Tipado como Response: o handler GraphQL do msw só aceita corpo JSON no HttpResponse
const serverError = (): Response => new HttpResponse("Internal Server Error", { status: 500 });

/** Conta as consultas do detalhe; `failFirst` faz a primeira falhar com HTTP 500. */
function detailApi({ failFirst = false, notFound = false } = {}) {
  const ids: number[] = [];
  server.use(
    anilist.query("AnimeDetail", async ({ variables }) => {
      ids.push(Number(variables.id));
      await delay(100);
      if (failFirst && ids.length === 1) return serverError();
      if (notFound) return HttpResponse.json({ data: { Media: null } });
      return HttpResponse.json({ data: buildDetailData(Number(variables.id)) });
    }),
  );
  return ids;
}

/** Consumidor mínimo da facade: só vê tipos do domínio. */
function DetailProbe({ id, attempt }: { id: number; attempt: number }) {
  const detail = useAnimeDetail(id, attempt);
  return (
    <p>
      {detail.title}: {detail.description}
    </p>
  );
}

/** Abre e fecha o "modal" do id, com Suspense e Error Boundary próprios, como o AnimeDetail. */
function Harness({ id }: { id: number }) {
  const [open, setOpen] = useState(true);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setOpen((current) => !current)}>
        Alternar
      </button>
      {open && (
        <ErrorBoundary onReset={() => setAttempt((current) => current + 1)}>
          <Suspense fallback={<p>Carregando detalhes</p>}>
            <DetailProbe id={id} attempt={attempt} />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}

describe("useAnimeDetail (facade do detalhe, UC08)", () => {
  it("busca o detalhe numa consulta própria, pelo id, e devolve o domínio", async () => {
    const ids = detailApi();
    await renderWithCatalog(<Harness id={7} />);

    expect(screen.getByText("Carregando detalhes")).toBeInTheDocument();
    expect(await screen.findByText("Anime 7: Sinopse do anime 7.")).toBeInTheDocument();
    expect(ids).toEqual([7]);
  });

  it("reabrir o mesmo anime lê o cache, sem nova consulta", async () => {
    const ids = detailApi();
    await renderWithCatalog(<Harness id={7} />);
    await screen.findByText(/Sinopse do anime 7/);

    await clickAndWait(screen.getByRole("button", { name: "Alternar" }));
    await clickAndWait(screen.getByRole("button", { name: "Alternar" }));
    await act(() => delay(30));

    expect(screen.getByText(/Sinopse do anime 7/)).toBeInTheDocument();
    expect(ids).toEqual([7]);
  });

  it("falha vai ao Error Boundary; a nova tentativa refaz a consulta", async () => {
    const ids = detailApi({ failFirst: true });
    await renderWithCatalog(<Harness id={7} />);

    await clickAndWait(await screen.findByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText(/Sinopse do anime 7/)).toBeInTheDocument();
    expect(ids).toEqual([7, 7]);
  });

  it("anime que o AniList não encontra também vai ao Error Boundary", async () => {
    detailApi({ notFound: true });
    await renderWithCatalog(<Harness id={404} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
