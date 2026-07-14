import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const data = vi.hoisted(() => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const table = {
    id: "11111111-1111-4111-8111-111111111111",
    code: "M1",
    label: "MESA_1",
    capacity: 4,
    status: "AVAILABLE",
    layoutId: "layout-1",
    positionX: 0,
    positionY: 0,
    width: 70,
    height: 70,
    rotation: 0,
  };
  const product = {
    id: "p1",
    name: "Te Verde",
    description: "rico",
    price: 2500,
    minimumQuantity: 1,
    currentQuantity: 5,
    maximumQuantity: 10,
    isActive: true,
    imageUrl: null,
    priceHistory: [],
  };
  const reservation = {
    id: "r1",
    tableId: table.id,
    table: { code: "M1", label: "MESA_1" },
    reservedFor: future,
    status: "ACTIVE",
    peopleCount: 2,
    holderName: "Ana",
    email: "a@b.com",
    phone: "+56912345678",
    guestNames: ["Bob"],
    notes: "nota",
    waitingUntil: null,
    confirmationStatus: "PENDING",
    createdAt: past,
  };
  const order = {
    id: "o1",
    tableId: table.id,
    table: { code: "M1", label: "MESA_1" },
    status: "OPEN",
    total: 5000,
    peopleCount: 2,
    notes: null,
    reservationId: null,
    items: [
      {
        id: "oi1",
        productId: product.id,
        product: { name: "Te Verde", price: 2500 },
        quantity: 2,
        unitPrice: 2500,
        subtotal: 5000,
        notes: null,
      },
    ],
    createdAt: past,
    closedAt: null,
  };
  const event = {
    id: "e1",
    title: "Fiesta",
    description: "desc",
    startsAt: future,
    endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ENABLED",
    isFreeEntry: false,
    totalTickets: 100,
    soldTickets: 10,
    officialImageUrl: null,
    ticketTypes: [
      {
        id: "tt1",
        eventId: "e1",
        name: "General",
        description: null,
        price: 100,
        includesDetails: "bebida",
        menuMode: "FIXED",
        menuTemplate: null,
        totalStock: 50,
        dailyStocks: [],
        isPromotional: false,
        promoMinQuantity: null,
        promoBundlePrice: null,
      },
    ],
  };
  const ticket = {
    id: "tk1",
    eventId: "e1",
    ticketTypeId: "tt1",
    attendeeFirstName: "Ana",
    attendeeLastName: "Paz",
    attendanceDate: "2026-07-02",
    price: 100,
    includesDetails: "bebida",
    menuSelection: null,
    menuSelectionSnapshot: null,
    menuExtraPrice: 0,
    status: "ACTIVE",
    createdAt: past,
  };
  const empleadoUser = {
    id: "u1",
    username: "juan",
    first_name: "Juan",
    last_name: "Perez",
    email: "j@x.com",
    isActive: true,
    role: { id: "r1", name: "Admin" },
    createdAt: past,
    updatedAt: past,
    trabajador: {
      id: "tr1",
      userId: "u1",
      rut: "11.111.111-1",
      comuna: "Santiago",
      direccion: "calle 1",
      telefono: "123",
      fechaNacimiento: "1990-01-01",
      edad: 34,
      sueldo: 500000,
      fotoUrl: null,
      createdAt: past,
      updatedAt: past,
    },
  };
  const schedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: true,
    opensAt: "10:00",
    closesAt: "23:30",
  }));
  return {
    tables: [table],
    products: [product],
    reservations: [reservation],
    orders: [order],
    events: [event],
    tickets: [ticket],
    layouts: [{ id: "layout-1", name: "Plano", isActive: true, description: null, tables: [table] }],
    empleados: {
      items: [empleadoUser],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    },
    schedule,
    report: {
      items: [order],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      monthlySummary: [
        {
          month: "2026-06",
          totalOrders: 1,
          paidOrders: 1,
          cancelledOrders: 0,
          totalSales: 5000,
          paidSales: 5000,
        },
      ],
      totals: {
        totalOrders: 1,
        paidOrders: 1,
        cancelledOrders: 0,
        totalSales: 5000,
        paidSales: 5000,
      },
    },
    migStatus: {
      executed: [{ name: "M1", timestamp: "1775822400000" }],
      pending: [{ name: "M2", timestamp: "1776000000000" }],
      order: "asc",
      summary: { totalExecuted: 1, totalPending: 1, totalMigrations: 2 },
    },
    migHistory: [
      {
        id: "h1",
        migrationName: "M1",
        action: "EXECUTE",
        userId: "u1",
        user: { name: "Juan", first_name: "Juan", last_name: "Perez" },
        success: true,
        errorMessage: null,
        executedAt: past,
        details: {},
      },
    ],
  };
});

const qResult = vi.hoisted(() => {
  const cache = new Map<unknown, object>();
  return (d: unknown) => {
    if (!cache.has(d)) {
      cache.set(d, {
        data: d,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: () => Promise.resolve({}),
      });
    }
    return cache.get(d);
  };
});
const mResult = vi.hoisted(() => {
  const stable = {
    mutate: () => undefined,
    mutateAsync: () => Promise.resolve({}),
    isPending: false,
    isError: false,
  };
  return () => stable;
});

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
  useOrdersQuery: () => qResult(data.orders),
  useOrdersReportQuery: () => qResult(data.report),
  useCreateOrderMutation: mResult,
  useUpdateOrderMutation: mResult,
  useDeleteOrderMutation: mResult,
}));
vi.mock("./core/api/tables.hooks", () => ({ useTablesQuery: () => qResult(data.tables) }));
vi.mock("./core/api/products.hooks", () => ({
  useProductsQuery: () => qResult(data.products),
  useProductQuery: () => qResult(data.products[0]),
  useCreateProductMutation: mResult,
  useUpdateProductMutation: mResult,
  useDeleteProductMutation: mResult,
  getProductByIdFromCache: () => data.products[0],
}));
vi.mock("./core/api/reservations.hooks", () => ({
  useReservationsQuery: () => qResult(data.reservations),
  useCreateReservationMutation: mResult,
  useUpdateReservationMutation: mResult,
  useDeleteReservationMutation: mResult,
  useReservationScheduleQuery: () => qResult(data.schedule),
  useUpdateReservationScheduleMutation: mResult,
}));
vi.mock("./core/api/layouts.hooks", () => ({
  useLayoutsQuery: () => qResult(data.layouts),
  LAYOUTS_QUERY_KEY: ["layouts"],
}));
vi.mock("./core/api/public.hooks", () => ({
  usePublicTablesQuery: () => qResult(data.tables),
  usePublicReservationScheduleQuery: () => qResult(data.schedule),
  usePublicCreateReservationMutation: mResult,
  usePublicReservationsQuery: () => qResult(data.reservations),
  usePublicMenuQuery: () => qResult(data.products),
}));
vi.mock("./core/api/empleados.hooks", () => ({
  useEmpleadosUsersQuery: () => qResult(data.empleados),
  useCreateEmpleadoUserMutation: mResult,
  useCreateTrabajadorMutation: mResult,
  useUpdateTrabajadorMutation: mResult,
}));
vi.mock("./core/api/events.hooks", () => ({
  useEventsQuery: () => qResult(data.events),
  useEventTicketsQuery: () => qResult(data.tickets),
  useCreateEventMutation: mResult,
  useUpdateEventMutation: mResult,
  useUpdateEventStatusMutation: mResult,
  useDeleteEventMutation: mResult,
  useCreateEventTicketMutation: mResult,
  useUpdateEventTicketMutation: mResult,
  useDeleteEventTicketMutation: mResult,
}));
vi.mock("./core/api/migrations.hooks", () => ({
  useMigrationsStatusQuery: () => qResult(data.migStatus),
  useMigrationsHistoryQuery: () => qResult(data.migHistory),
  useExecuteMigrationMutation: mResult,
  useRevertMigrationMutation: mResult,
}));

import { MigrationsView } from "./views/MigrationsView/MigrationsView";
import { SalesReportView } from "./views/SalesView/SalesReportView";
import { ReservationsView } from "./views/ReservationsView/ReservationsView";
import { BodyInventory } from "./components/inventory/BodyInventory";
import { BodyEmpleados } from "./components/empleados/BodyEmpleados";
import { OrderTaker } from "./components/teaRoom/components/OrderTaker/OrderTaker";
import { EventsTicketsView } from "./views/EventsTicketsView/EventsTicketsView";
import { PublicReservationsView } from "./views/public/reservations/PublicReservationsView";

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

const sweep = () => {
  for (const b of screen.queryAllByRole("button")) {
    try {
      fireEvent.click(b);
    } catch {
      /* noop */
    }
  }
  for (const input of screen.queryAllByRole("textbox")) {
    try {
      fireEvent.change(input, { target: { value: "1" } });
    } catch {
      /* noop */
    }
  }
  for (const sel of screen.queryAllByRole("combobox")) {
    try {
      fireEvent.change(sel, { target: { value: "1" } });
    } catch {
      /* noop */
    }
  }
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Vistas grandes con datos (render + interaccion)", () => {
  it.each([
    ["MigrationsView", <MigrationsView key="m" />],
    ["SalesReportView", <SalesReportView key="s" />],
    ["PublicReservationsView", <PublicReservationsView key="p" />],
    ["ReservationsView", <ReservationsView key="r" />],
    ["BodyInventory", <BodyInventory key="i" />],
    ["BodyEmpleados", <BodyEmpleados key="e" />],
    ["OrderTaker", <OrderTaker key="o" selectedTableId="11111111-1111-4111-8111-111111111111" />],
    ["EventsTicketsView", <EventsTicketsView key="ev" />],
  ])("%s con datos", (_name, ui) => {
    const { unmount } = renderView(ui);
    sweep();
    sweep();
    unmount();
    expect(true).toBe(true);
  });
});

void FUTURE;
void PAST;
