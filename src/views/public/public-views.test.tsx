import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const publicHooks = vi.hoisted(() => ({
  usePublicMenuQuery: vi.fn(),
}));
vi.mock("../../core/api/public.hooks", () => publicHooks);

import { PublicMenuView } from "./menu/PublicMenuView";
import { PublicHeader } from "../../components/public/PublicHeader";

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("PublicHeader", () => {
  it("renderiza navegacion", () => {
    wrap(<PublicHeader />);
    expect(screen.getByText("Reservas")).toBeInTheDocument();
    expect(screen.getByText("Carta")).toBeInTheDocument();
  });
});

describe("PublicMenuView", () => {
  it("muestra productos y filtra", () => {
    publicHooks.usePublicMenuQuery.mockReturnValue({
      data: [
        { id: "1", name: "Te Verde", description: "rico", price: 2500 },
        { id: "2", name: "Cafe", description: null, price: 1500 },
      ],
      isLoading: false,
    });
    wrap(<PublicMenuView />);
    expect(screen.getByText("Te Verde")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Buscar productos/), {
      target: { value: "cafe" },
    });
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.queryByText("Te Verde")).toBeNull();
  });

  it("estado de carga", () => {
    publicHooks.usePublicMenuQuery.mockReturnValue({
      data: [],
      isLoading: true,
    });
    wrap(<PublicMenuView />);
    expect(screen.getByText("Cargando carta...")).toBeInTheDocument();
  });

  it("sin resultados", () => {
    publicHooks.usePublicMenuQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    wrap(<PublicMenuView />);
    expect(
      screen.getByText("No hay productos para el filtro seleccionado."),
    ).toBeInTheDocument();
  });
});
