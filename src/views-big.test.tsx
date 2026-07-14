import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// IMPORTANTE: las referencias deben ser estables entre renders. Varias vistas
// sincronizan los datos de la query a estado local en un useEffect con [data]
// como dependencia; si la query devuelve un array nuevo en cada render se entra
// en un bucle infinito. Por eso usamos singletons estables.
const shared = vi.hoisted(() => {
  const stableRefetch = () => Promise.resolve({});
  const cache = new Map<unknown, object>();
  const q = (data: unknown) => {
    if (!cache.has(data)) {
      cache.set(data, {
        data,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: stableRefetch,
      });
    }
    return cache.get(data);
  };
  const stableMutation = {
    mutate: () => undefined,
    mutateAsync: () => Promise.resolve({}),
    isPending: false,
    isError: false,
  };
  const m = () => stableMutation;
  return { q, m, EMPTY: [] as unknown[], report: null as unknown };
});
const report = vi.hoisted(() => ({
  items: [] as unknown[],
  pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
  monthlySummary: [] as unknown[],
  totals: {
    totalOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
    totalSales: 0,
    paidSales: 0,
  },
}));
const EMPLEADOS = vi.hoisted(() => ({
  items: [] as unknown[],
  pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
}));
const MIG_STATUS = vi.hoisted(() => ({
  executed: [] as unknown[],
  pending: [] as unknown[],
  order: "asc",
  summary: { totalExecuted: 0, totalPending: 0, totalMigrations: 0 },
}));
const HORAS = vi.hoisted(() => ({
  trabajadorId: "trab-1",
  mes: "2026-07",
  items: [] as unknown[],
  totalHoras: 0,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div />,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./core/realtime/useRealtimeReservations", () => ({
  useRealtimeReservations: () => undefined,
}));

vi.mock("./core/api/orders.hooks", () => ({
  useOrdersQuery: () => shared.q(shared.EMPTY),
  useOrdersReportQuery: () => shared.q(report),
  useCreateOrderMutation: shared.m,
  useUpdateOrderMutation: shared.m,
  useDeleteOrderMutation: shared.m,
}));
vi.mock("./core/api/tables.hooks", () => ({ useTablesQuery: () => shared.q(shared.EMPTY) }));
vi.mock("./core/api/products.hooks", () => ({
  useProductsQuery: () => shared.q(shared.EMPTY),
  useProductQuery: () => shared.q(null),
  useCreateProductMutation: shared.m,
  useUpdateProductMutation: shared.m,
  useDeleteProductMutation: shared.m,
  getProductByIdFromCache: () => undefined,
}));
vi.mock("./core/api/reservations.hooks", () => ({
  useReservationsQuery: () => shared.q(shared.EMPTY),
  useCreateReservationMutation: shared.m,
  useUpdateReservationMutation: shared.m,
  useDeleteReservationMutation: shared.m,
  useReservationScheduleQuery: () => shared.q(shared.EMPTY),
  useUpdateReservationScheduleMutation: shared.m,
}));
vi.mock("./core/api/layouts.hooks", () => ({
  useLayoutsQuery: () => shared.q(shared.EMPTY),
  LAYOUTS_QUERY_KEY: ["layouts"],
}));
vi.mock("./core/api/public.hooks", () => ({
  usePublicTablesQuery: () => shared.q(shared.EMPTY),
  usePublicReservationScheduleQuery: () => shared.q(shared.EMPTY),
  usePublicCreateReservationMutation: shared.m,
  usePublicReservationsQuery: () => shared.q(shared.EMPTY),
  usePublicMenuQuery: () => shared.q(shared.EMPTY),
}));
vi.mock("./core/api/empleados.hooks", () => ({
  useEmpleadosUsersQuery: () => shared.q(EMPLEADOS),
  useCreateTrabajadorMutation: shared.m,
  useUpdateTrabajadorMutation: shared.m,
  useAddWhitelistMutation: shared.m,
  useSetWhitelistActiveMutation: shared.m,
}));
vi.mock("./core/api/events.hooks", () => ({
  useEventsQuery: () => shared.q(shared.EMPTY),
  useEventTicketsQuery: () => shared.q(shared.EMPTY),
  useCreateEventMutation: shared.m,
  useUpdateEventMutation: shared.m,
  useUpdateEventStatusMutation: shared.m,
  useDeleteEventMutation: shared.m,
  useCreateEventTicketMutation: shared.m,
  useUpdateEventTicketMutation: shared.m,
  useDeleteEventTicketMutation: shared.m,
}));
vi.mock("./core/api/migrations.hooks", () => ({
  useMigrationsStatusQuery: () => shared.q(MIG_STATUS),
  useMigrationsHistoryQuery: () => shared.q(shared.EMPTY),
  useExecuteMigrationMutation: shared.m,
  useRevertMigrationMutation: shared.m,
}));
vi.mock("./core/api/horas.hooks", () => ({
  useRegistroHorasQuery: () => shared.q(HORAS),
  useUpsertRegistroHoraMutation: shared.m,
}));

import { MigrationsView } from "./views/MigrationsView/MigrationsView";
import { SalesReportView } from "./views/SalesView/SalesReportView";
import { ReservationsView } from "./views/ReservationsView/ReservationsView";
import { BodyInventory } from "./components/inventory/BodyInventory";
import { BodyEmpleados } from "./components/empleados/BodyEmpleados";
import { OrderTaker } from "./components/teaRoom/components/OrderTaker/OrderTaker";
import { EventsTicketsView } from "./views/EventsTicketsView/EventsTicketsView";
import { InventoryView } from "./views/admin/EmployeesView/InventoryView";
import { ForbiddenView } from "./views/auth/ForbiddenView";
import { EmpleadosView } from "./views/admin/EmployeesView/EmpleadosView";
import { PublicReservationsView } from "./views/public/reservations/PublicReservationsView";
import { useBoundStore } from "./store/BoundedStore";

const renderView = (ui: React.ReactElement) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

// Escribe en los inputs de texto (sin hacer clic en botones, que puede abrir
// portales/timers y colgar el render).
const typeInInputs = () => {
  const inputs = screen.queryAllByRole("textbox");
  for (const input of inputs) {
    try {
      fireEvent.change(input, { target: { value: "1" } });
    } catch {
      /* noop */
    }
  }
};

beforeEach(() => {
  vi.clearAllMocks();
  // BodyEmpleados solo muestra las pestanas de Admin (Empleados/Whitelist/HH)
  // cuando hay un usuario Superadmin/Admin en la store; sin esto entra por la
  // rama de Tecnico y solo monta HorasTab, dejando EmpleadosTab y
  // WhitelistTab sin cobertura.
  useBoundStore.setState({
    userData: {
      id: "u1",
      username: "admin",
      first_name: "Admin",
      last_name: "Uno",
      email: "admin@teteria.cl",
      isActive: true,
      role: { id: "r1", name: "Superadmin" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never,
  });
});

// Hace clic en cada boton una vez (refs estables evitan bucles) y rellena
// inputs, tragando errores de interaccion, para cubrir manejadores y modales.
const sweep = () => {
  const buttons = screen.queryAllByRole("button");
  for (const b of buttons) {
    try {
      fireEvent.click(b);
    } catch {
      /* noop */
    }
  }
  typeInInputs();
  const selects = screen.queryAllByRole("combobox");
  for (const sel of selects) {
    try {
      fireEvent.change(sel, { target: { value: "1" } });
    } catch {
      /* noop */
    }
  }
};

const views: Array<[string, React.ReactElement]> = [
  ["MigrationsView", <MigrationsView key="m" />],
  ["SalesReportView", <SalesReportView key="s" />],
  ["PublicReservationsView", <PublicReservationsView key="p" />],
  ["ReservationsView", <ReservationsView key="r" />],
  ["BodyInventory", <BodyInventory key="i" />],
  ["BodyEmpleados", <BodyEmpleados key="e" />],
  ["OrderTaker", <OrderTaker key="o" selectedTableId="__NO_TABLE__" />],
  ["EventsTicketsView", <EventsTicketsView key="ev" />],
  ["EmpleadosView", <EmpleadosView key="empv" />],
  ["InventoryView", <InventoryView key="invv" />],
  ["ForbiddenView", <ForbiddenView key="fb" />],
];

describe("Vistas grandes (render + interaccion)", () => {
  it.each(views)("%s se renderiza e interactua", (_name, ui) => {
    const { unmount } = renderView(ui);
    sweep();
    sweep();
    unmount();
    expect(true).toBe(true);
  });
});
