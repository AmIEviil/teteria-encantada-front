import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MigrationStatusTable } from "./MigrationStatusTable";

const baseProps = {
  title: "Migraciones pendientes",
  open: true,
  onToggle: vi.fn(),
  rows: [{ name: "1700000000-init", timestamp: "1700000000000" }] as any,
  emptyLabel: "No hay migraciones pendientes.",
  actionLabel: "Ejecutar",
  actionIcon: null,
  loadingAction: false,
  onAction: vi.fn(),
  order: "asc" as const,
};

describe("MigrationStatusTable", () => {
  it("lista filas y dispara la accion", () => {
    const onAction = vi.fn();
    render(<MigrationStatusTable {...baseProps} onAction={onAction} />);

    expect(screen.getByText("1700000000-init")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ejecutar"));
    expect(onAction).toHaveBeenCalledWith("1700000000-init");
  });

  it("muestra el vacio cuando no hay filas", () => {
    render(<MigrationStatusTable {...baseProps} rows={[]} />);
    expect(screen.getByText("No hay migraciones pendientes.")).toBeInTheDocument();
  });
});
