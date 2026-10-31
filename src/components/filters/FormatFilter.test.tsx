import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { AnimeFormat } from "../../domain/anime";
import { FORMAT_OPTIONS } from "../../domain/formats";
import { FormatFilter } from "./FormatFilter";

/** Estado local no lugar da facade: o componente só recebe a seleção e as ações. */
function StatefulFilter({ initial = [] }: { initial?: AnimeFormat[] }) {
  const [selected, setSelected] = useState(initial);
  return (
    <FormatFilter
      selected={selected}
      onToggle={(format) =>
        setSelected((current) =>
          current.includes(format)
            ? current.filter((item) => item !== format)
            : [...current, format],
        )
      }
      onClear={() => setSelected([])}
    />
  );
}

const button = (name: string) => screen.getByRole("button", { name });

const ALL_FORMATS = FORMAT_OPTIONS[0].label;

/** Rótulos dos botões com aria-pressed="true", na ordem da tela. */
const pressed = () =>
  screen.getAllByRole("button", { pressed: true }).map((item) => item.textContent);

describe("FormatFilter (specs/filtros.md)", () => {
  it('agrupa os 8 botões na ordem do design em role="group" com nome "Formato"', () => {
    render(<StatefulFilter />);

    const group = screen.getByRole("group", { name: "Formato" });
    expect(
      within(group)
        .getAllByRole("button")
        .map((item) => item.textContent),
    ).toEqual(FORMAT_OPTIONS.map((option) => option.label));
  });

  it('sem seleção, só "All Formats" está pressionado', () => {
    render(<StatefulFilter />);

    expect(pressed()).toEqual([ALL_FORMATS]);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(7);
  });

  it('clicar em "Movie" marca Movie e desmarca All Formats; clicar de novo desmarca', () => {
    render(<StatefulFilter />);

    fireEvent.click(button("Movie"));
    expect(pressed()).toEqual(["Movie"]);

    fireEvent.click(button("Movie"));
    expect(pressed()).toEqual([ALL_FORMATS]);
  });

  it("permite mais de um formato ao mesmo tempo", () => {
    render(<StatefulFilter />);

    fireEvent.click(button("TV Show"));
    fireEvent.click(button("OVA"));

    expect(pressed()).toEqual(["TV Show", "OVA"]);
  });

  it('"All Formats" limpa a seleção', () => {
    render(<StatefulFilter initial={["TV", "MUSIC"]} />);
    expect(pressed()).toEqual(["TV Show", "Music"]);

    fireEvent.click(button(ALL_FORMATS));

    expect(pressed()).toEqual([ALL_FORMATS]);
  });
});
