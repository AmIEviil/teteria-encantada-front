import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const UUID1 = "11111111-1111-4111-8111-111111111111";
const UUID2 = "22222222-2222-4222-8222-222222222222";

const layoutsQuery = vi.hoisted(() => ({ fn: vi.fn() }));
const tablesQuery = vi.hoisted(() => ({ fn: vi.fn() }));
const ordersQuery = vi.hoisted(() => ({ fn: vi.fn() }));
const reservationsQuery = vi.hoisted(() => ({ fn: vi.fn() }));
const layoutsServiceMock = vi.hoisted(() => ({
  saveSnapshot: vi.fn(),
  createSnapshot: vi.fn(),
}));

vi.mock("../../core/api/layouts.hooks", () => ({
  useLayoutsQuery: () => layoutsQuery.fn(),
}));
vi.mock("../../core/api/tables.hooks", () => ({
  useTablesQuery: () => tablesQuery.fn(),
}));
vi.mock("../../core/api/orders.hooks", () => ({
  useOrdersQuery: () => ordersQuery.fn(),
}));
vi.mock("../../core/api/reservations.hooks", () => ({
  useReservationsQuery: () => reservationsQuery.fn(),
}));
vi.mock("../../core/api/layouts.service", () => ({
  layoutsService: layoutsServiceMock,
}));
vi.mock("../../core/realtime/useRealtimeReservations", () => ({
  useRealtimeReservations: () => undefined,
}));

import { FloorPlan } from "./FloorPlan/FloorPlan";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const renderFloorPlan = (props = {}) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <FloorPlan {...props} />
    </QueryClientProvider>,
  );
};

const persistedTable = (id: string, label: string, x = 0) => ({
  id,
  code: label,
  label,
  positionX: x,
  positionY: 0,
  width: 70,
  height: 70,
  rotation: 0,
  status: "AVAILABLE",
});

beforeEach(() => {
  vi.clearAllMocks();
  layoutsQuery.fn.mockReturnValue({
    data: [
      {
        id: UUID1,
        name: "Plano Principal",
        isActive: true,
        description: JSON.stringify({
          version: 1,
          gridSize: { rows: 5, cols: 8 },
          chairs: [{ id: "ch1", position: { x: 80, y: 80 }, rotation: 0 }],
        }),
      },
    ],
  });
  tablesQuery.fn.mockReturnValue({
    data: [
      persistedTable(UUID1, "MESA_1", 0),
      persistedTable(UUID2, "MESA_2", 160),
    ],
  });
  ordersQuery.fn.mockReturnValue({ data: [{ tableId: UUID1 }] });
  reservationsQuery.fn.mockReturnValue({
    data: [{ tableId: UUID2, confirmationStatus: "PENDING" }],
  });
  layoutsServiceMock.saveSnapshot.mockResolvedValue({
    id: UUID1,
    name: "Plano Principal",
    description: JSON.stringify({
      version: 1,
      gridSize: { rows: 5, cols: 8 },
      chairs: [],
    }),
    tables: [persistedTable(UUID1, "MESA_1")],
  });
  layoutsServiceMock.createSnapshot.mockResolvedValue({
    id: UUID2,
    name: "Nuevo",
    description: null,
    tables: [],
  });
});

describe("FloorPlan", () => {
  it("renderiza mesas persistidas (modo vista)", () => {
    renderFloorPlan();
    expect(screen.getByText("MESA_1")).toBeInTheDocument();
    expect(screen.getByText("MESA_2")).toBeInTheDocument();
  });

  it("previewOnly oculta acciones", () => {
    renderFloorPlan({ previewOnly: true });
    expect(screen.queryByText("Plano Inicial")).toBeNull();
  });

  const enterEdit = () =>
    fireEvent.click(screen.getAllByRole("button").at(-1) as HTMLElement);

  it("flujo de edicion: sidebar, opciones de mesa y guardar", async () => {
    renderFloorPlan();
    enterEdit();
    // SideBar visible (boton con texto)
    expect(screen.getByText("Plano Inicial")).toBeInTheDocument();

    // opciones de una mesa (abrir dropmenu ⋮)
    const menus = screen.getAllByText("⋮");
    fireEvent.click(menus[0]);
    fireEvent.click(screen.getByText("Girar"));
    fireEvent.click(menus[0]);
    fireEvent.click(screen.getByText("Marcar No Disponible"));
    fireEvent.click(menus[0]);
    fireEvent.click(screen.getByText("Alternar nombre"));
    const swapTargets = screen.getAllByText("MESA_2");
    fireEvent.click(swapTargets.at(-1) as HTMLElement);

    // SideBar add buttons (sin texto): primeros 3 botones
    const addButtons = screen.getAllByRole("button");
    fireEvent.click(addButtons[0]);
    fireEvent.click(addButtons[1]);
    fireEvent.click(addButtons[2]);
    screen.getAllByText("Columna").forEach((b) => fireEvent.click(b));
    screen.getAllByText("Fila").forEach((b) => fireEvent.click(b));
    fireEvent.click(screen.getByText("Plano Inicial"));

    // guardar (ultimo boton)
    fireEvent.click(screen.getAllByRole("button").at(-1) as HTMLElement);
    await waitFor(() =>
      expect(layoutsServiceMock.saveSnapshot).toHaveBeenCalled(),
    );
  });

  it("eliminar mesa y limpiar plano", () => {
    renderFloorPlan();
    enterEdit();
    const menus = screen.getAllByText("⋮");
    fireEvent.click(menus[0]);
    fireEvent.click(screen.getByText("Eliminar"));
    fireEvent.click(screen.getByText("Limpiar Plano"));
    expect(screen.queryByText("MESA_2")).toBeNull();
  });

  it("cancelar edicion restaura", () => {
    renderFloorPlan();
    enterEdit();
    fireEvent.click(screen.getAllByRole("button")[2]); // agregar silla
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons.at(-2) as HTMLElement); // cancelar
    expect(screen.queryByText("Plano Inicial")).toBeNull();
  });

  it("guarda como nuevo cuando no hay layout activo", async () => {
    layoutsQuery.fn.mockReturnValue({ data: [] });
    tablesQuery.fn.mockReturnValue({ data: [] });
    renderFloorPlan();
    enterEdit();
    fireEvent.click(screen.getAllByRole("button")[0]); // agregar mesa
    fireEvent.click(screen.getAllByRole("button").at(-1) as HTMLElement);
    await waitFor(() =>
      expect(layoutsServiceMock.createSnapshot).toHaveBeenCalled(),
    );
  });

  it("maneja error al guardar", async () => {
    layoutsServiceMock.saveSnapshot.mockRejectedValue(new Error("falla"));
    renderFloorPlan();
    enterEdit();
    fireEvent.click(screen.getAllByRole("button")[2]); // agregar silla
    fireEvent.click(screen.getAllByRole("button").at(-1) as HTMLElement);
    await waitFor(() =>
      expect(layoutsServiceMock.saveSnapshot).toHaveBeenCalled(),
    );
  });
});
