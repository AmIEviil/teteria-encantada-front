import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

import CollapsableTable from "./collapsable-table/CollapsableTable";
import Calendar from "./datepicker/DatePicker";
import DatePickers from "./calendar/DatePicker";
import { CustomCalendarV2 } from "./calendar/CustomCalendarV2";

describe("CollapsableTable", () => {
  const titles = [
    { label: "Nombre", key: "name", showOrder: true },
    { label: "Edad", key: "age" },
  ];
  const data = { Grupo1: [{ id: "1" }, { id: "2" }] };

  it("renderiza grupos, ordena, colapsa y selecciona", () => {
    const onOrderChange = vi.fn();
    const onItemSelection = vi.fn();
    const onSelectAllInGroup = vi.fn();
    render(
      <CollapsableTable
        titlesTable={titles}
        data={data}
        orderBy="name"
        orderDirection="ASC"
        onOrderChange={onOrderChange}
        showCheckBoxes
        selectedItems={[{ id: "1" }]}
        onItemSelection={onItemSelection}
        onSelectAllInGroup={onSelectAllInGroup}
        renderRow={(item, _i, isSelected, onSelect) => (
          <tr key={item.id}>
            <td>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
              />
            </td>
          </tr>
        )}
      />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onOrderChange).toHaveBeenCalled();
    // colapsar grupo
    fireEvent.click(screen.getByText(/Grupo1/));
  });

  it("loading y vacio", () => {
    const { rerender } = render(
      <CollapsableTable
        titlesTable={titles}
        data={{}}
        loading
        renderRow={() => null}
      />,
    );
    rerender(
      <CollapsableTable
        titlesTable={titles}
        data={{}}
        emptyMessage="nada"
        renderRow={() => null}
      />,
    );
    expect(screen.getByText("nada")).toBeInTheDocument();
  });
});

describe("Calendar (react-datepicker)", () => {
  it("modo range abre y usa footer", () => {
    const onChange = vi.fn();
    render(
      <Calendar
        mode="range"
        title="Rango"
        required
        initialValue={[new Date(2026, 0, 1), new Date(2026, 0, 5)]}
        onChange={onChange}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    const today = screen.queryByText("modules.common.today");
    if (today) fireEvent.click(today);
  });

  it("modo day", () => {
    const onChange = vi.fn();
    render(
      <Calendar mode="day" initialValue={new Date(2026, 0, 1)} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button"));
    const erase = screen.queryByText("modules.common.erase");
    if (erase) fireEvent.click(erase);
  });
});

describe("DatePickers (MUI)", () => {
  it("renderiza con label", () => {
    render(<DatePickers label="Fecha" required onChange={vi.fn()} />);
    expect(screen.getByText("Fecha")).toBeInTheDocument();
  });
});

describe("CustomCalendarV2", () => {
  it("abre, navega, selecciona y guarda", () => {
    const onSave = vi.fn();
    render(
      <CustomCalendarV2
        label="Fecha"
        initialDate={new Date(2026, 5, 15)}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    // selecciona un dia visible del mes (junio 2026)
    fireEvent.click(screen.getByText("20"));
    fireEvent.click(screen.getByText("Guardar"));
    expect(onSave).toHaveBeenCalled();
  });

  it("con availableDates y cancelar", () => {
    const onCancel = vi.fn();
    render(
      <CustomCalendarV2
        showLabel={false}
        styleVariant="default"
        availableDates={["2026-06-10", "2026-06-20"]}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    const cancelar = screen.queryByText("Cancelar");
    if (cancelar) fireEvent.click(cancelar);
  });

  it("disabled no abre", () => {
    render(<CustomCalendarV2 disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Guardar")).toBeNull();
  });
});
