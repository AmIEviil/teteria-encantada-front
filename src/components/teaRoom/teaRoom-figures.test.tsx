import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Chair } from "./components/chair/Chair";
import { Table } from "./components/table/Table";

describe("Chair", () => {
  it("onlyView sin posicion", () => {
    render(<Chair onlyView rotation={90} />);
    expect(document.querySelector("div")).toBeInTheDocument();
  });
  it("onlyView con posicion en vista", () => {
    render(<Chair onlyView usePositionInView position={{ x: 10, y: 20 }} />);
    expect(document.querySelector("div")).toBeInTheDocument();
  });
  it("draggable con opciones girar/eliminar", () => {
    const onRotate = vi.fn();
    const onDelete = vi.fn();
    render(
      <Chair id="c1" position={{ x: 0, y: 0 }} onRotate={onRotate} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Girar"));
    expect(onRotate).toHaveBeenCalledWith("c1");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalledWith("c1");
  });
});

describe("Table", () => {
  it("onlyView seleccionable", () => {
    const onSelectTable = vi.fn();
    render(
      <Table
        id="t1"
        label="Mesa 1"
        numberOfSeats={4}
        onlyView
        usePositionInView
        position={{ x: 5, y: 5 }}
        onSelectTable={onSelectTable}
        confirmationStatus="PENDING"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelectTable).toHaveBeenCalledWith("t1");
  });

  it("onlyView no seleccionable con badge confirmado", () => {
    render(
      <Table
        id="t2"
        code="M2"
        type="large"
        isRotated
        onlyView
        confirmationStatus="CONFIRMED"
        status="RESERVED"
      />,
    );
    expect(screen.getByText("M2")).toBeInTheDocument();
  });

  it("out of service no selecciona", () => {
    const onSelectTable = vi.fn();
    render(
      <Table id="t3" onlyView status="OUT_OF_SERVICE" onSelectTable={onSelectTable} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelectTable).not.toHaveBeenCalled();
  });

  it("editable con opciones y swap", () => {
    const onChangeStatus = vi.fn();
    const onRotate = vi.fn();
    const onDelete = vi.fn();
    const onSwapLabels = vi.fn();
    render(
      <Table
        id="t4"
        label="Mesa 4"
        onChangeStatus={onChangeStatus}
        onRotate={onRotate}
        onDelete={onDelete}
        onSwapLabels={onSwapLabels}
        allTables={[
          { id: "t4", label: "Mesa 4" },
          { id: "t5", label: "Mesa 5" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Marcar No Disponible"));
    expect(onChangeStatus).toHaveBeenCalledWith("t4", "OUT_OF_SERVICE");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Alternar nombre"));
    fireEvent.click(screen.getByText("Mesa 5"));
    expect(onSwapLabels).toHaveBeenCalledWith("t4", "t5");
  });

  it("editable seleccionable", () => {
    const onSelectTable = vi.fn();
    render(<Table id="t6" label="Mesa 6" onSelectTable={onSelectTable} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelectTable).toHaveBeenCalledWith("t6");
  });
});
