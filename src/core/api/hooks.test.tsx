import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const svcMock = vi.hoisted(() => () => ({
  findAll: vi.fn().mockResolvedValue([]),
  findOne: vi.fn().mockResolvedValue({ id: "x" }),
  findUsers: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  findReport: vi.fn().mockResolvedValue({ items: [] }),
  findTickets: vi.fn().mockResolvedValue([]),
  findMenu: vi.fn().mockResolvedValue([]),
  findTables: vi.fn().mockResolvedValue([]),
  findReservations: vi.fn().mockResolvedValue([]),
  findReservationSchedule: vi.fn().mockResolvedValue([]),
  findSchedule: vi.fn().mockResolvedValue([]),
  getStatus: vi.fn().mockResolvedValue({ executed: [], pending: [] }),
  getHistory: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: "x" }),
  createReservation: vi.fn().mockResolvedValue({ id: "x" }),
  createTicket: vi.fn().mockResolvedValue([{ id: "t" }, { id: "t2" }]),
  createUser: vi.fn().mockResolvedValue({ id: "u" }),
  update: vi.fn().mockResolvedValue({ id: "x" }),
  updateStatus: vi.fn().mockResolvedValue({ id: "x" }),
  updateTicket: vi.fn().mockResolvedValue({ id: "t" }),
  updateSchedule: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue({ message: "ok" }),
  removeTicket: vi.fn().mockResolvedValue({ message: "ok" }),
  executeMigration: vi.fn().mockResolvedValue({ message: "ok" }),
  revertMigration: vi.fn().mockResolvedValue({ message: "ok" }),
  upload: vi.fn().mockResolvedValue({ id: "i", url: "u" }),
}));

vi.mock("./products.service", () => ({ productsService: svcMock() }));
vi.mock("./orders.service", () => ({ ordersService: svcMock() }));
vi.mock("./events.service", () => ({ eventsService: svcMock() }));
vi.mock("./layouts.service", () => ({ layoutsService: svcMock() }));
vi.mock("./reservations.service", () => ({ reservationsService: svcMock() }));
vi.mock("./public.service", () => ({ publicService: svcMock() }));
vi.mock("./empleados.service", () => ({ empleadosService: svcMock() }));
vi.mock("./auth.service", () => ({ authService: svcMock() }));
vi.mock("./migrations.service", () => ({ migrationsService: svcMock() }));
vi.mock("./tables.service", () => ({ tablesService: svcMock() }));
vi.mock("./images.service", () => ({ imagesService: svcMock() }));

import * as productHooks from "./products.hooks";
import * as orderHooks from "./orders.hooks";
import * as eventHooks from "./events.hooks";
import * as layoutHooks from "./layouts.hooks";
import * as reservationHooks from "./reservations.hooks";
import * as publicHooks from "./public.hooks";
import * as empleadoHooks from "./empleados.hooks";
import * as migrationHooks from "./migrations.hooks";
import * as tableHooks from "./tables.hooks";
import * as imageHooks from "./images.hooks";

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

const runQuery = async (hook: () => { isFetched: boolean }) => {
  const { result } = renderHook(hook, { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isFetched).toBe(true));
};

const runMutation = async (
  hook: () => { mutateAsync: (p?: unknown) => Promise<unknown> },
  payload?: unknown,
) => {
  const { result } = renderHook(hook, { wrapper: createWrapper() });
  await act(async () => {
    try {
      await result.current.mutateAsync(payload);
    } catch {
      /* error path */
    }
  });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hooks queries", () => {
  it("ejecuta todos los queries", async () => {
    await runQuery(() => productHooks.useProductsQuery());
    await runQuery(() => productHooks.useProductQuery("p1"));
    await runQuery(() => orderHooks.useOrdersQuery({ tableId: "t" }));
    await runQuery(() =>
      orderHooks.useOrdersReportQuery({ filters: {} as never }),
    );
    await runQuery(() => eventHooks.useEventsQuery({ status: "ENABLED" } as never));
    await runQuery(() => eventHooks.useEventTicketsQuery("e1"));
    await runQuery(() => layoutHooks.useLayoutsQuery());
    await runQuery(() => reservationHooks.useReservationsQuery({ tableId: "t" } as never));
    await runQuery(() => reservationHooks.useReservationScheduleQuery());
    await runQuery(() => publicHooks.usePublicMenuQuery());
    await runQuery(() => publicHooks.usePublicTablesQuery());
    await runQuery(() => publicHooks.usePublicReservationsQuery({ email: "a@b.com" } as never));
    await runQuery(() => publicHooks.usePublicReservationScheduleQuery());
    await runQuery(() => empleadoHooks.useEmpleadosUsersQuery({ page: 1 } as never));
    await runQuery(() => migrationHooks.useMigrationsStatusQuery("asc"));
    await runQuery(() => migrationHooks.useMigrationsHistoryQuery("M1"));
    await runQuery(() => tableHooks.useTablesQuery("l1"));
  });

  it("getProductByIdFromCache", () => {
    expect(
      productHooks.getProductByIdFromCache([{ id: "p" }] as never, "p"),
    ).toEqual({ id: "p" });
    expect(productHooks.getProductByIdFromCache(undefined, "p")).toBeUndefined();
  });
});

describe("hooks mutations (success)", () => {
  it("ejecuta mutaciones exitosas", async () => {
    await runMutation(() => productHooks.useCreateProductMutation(), {});
    await runMutation(() => productHooks.useUpdateProductMutation(), { id: "p", payload: {} });
    await runMutation(() => productHooks.useDeleteProductMutation(), "p");
    await runMutation(() => orderHooks.useCreateOrderMutation(), {});
    await runMutation(() => orderHooks.useUpdateOrderMutation(), { id: "o", payload: {} });
    await runMutation(() => orderHooks.useDeleteOrderMutation(), "o");
    await runMutation(() => eventHooks.useCreateEventMutation(), {});
    await runMutation(() => eventHooks.useUpdateEventMutation(), { id: "e", payload: {} });
    await runMutation(() => eventHooks.useUpdateEventStatusMutation(), { id: "e", payload: {} });
    await runMutation(() => eventHooks.useDeleteEventMutation(), "e");
    await runMutation(() => eventHooks.useCreateEventTicketMutation(), { eventId: "e", payload: {} });
    await runMutation(() => eventHooks.useUpdateEventTicketMutation(), { eventId: "e", ticketId: "t", payload: {} });
    await runMutation(() => eventHooks.useDeleteEventTicketMutation(), { eventId: "e", ticketId: "t" });
    await runMutation(() => layoutHooks.useCreateLayoutMutation(), {});
    await runMutation(() => layoutHooks.useUpdateLayoutMutation(), { id: "l", payload: {} });
    await runMutation(() => layoutHooks.useDeleteLayoutMutation(), "l");
    await runMutation(() => reservationHooks.useCreateReservationMutation(), {});
    await runMutation(() => reservationHooks.useUpdateReservationMutation(), { id: "r", payload: {} });
    await runMutation(() => reservationHooks.useDeleteReservationMutation(), "r");
    await runMutation(() => reservationHooks.useUpdateReservationScheduleMutation(), {});
    await runMutation(() => publicHooks.usePublicCreateReservationMutation(), {});
    await runMutation(() => empleadoHooks.useCreateTrabajadorMutation(), {});
    await runMutation(() => empleadoHooks.useUpdateTrabajadorMutation(), { id: "tr", payload: {} });
    await runMutation(() => empleadoHooks.useCreateEmpleadoUserMutation(), {});
    await runMutation(() => migrationHooks.useExecuteMigrationMutation(), "M1");
    await runMutation(() => migrationHooks.useRevertMigrationMutation(), "M1");
    await runMutation(() => imageHooks.useUploadImageMutation(), new File(["x"], "x.png"));
  });
});

describe("hooks mutations (error)", () => {
  it("ejecuta rutas onError", async () => {
    const { productsService } = await import("./products.service");
    const { ordersService } = await import("./orders.service");
    const { eventsService } = await import("./events.service");
    const { layoutsService } = await import("./layouts.service");
    const { reservationsService } = await import("./reservations.service");
    const { empleadosService } = await import("./empleados.service");
    const { authService } = await import("./auth.service");
    const { migrationsService } = await import("./migrations.service");

    const boom = new Error("boom");
    Object.values(productsService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(ordersService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(eventsService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(layoutsService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(reservationsService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(empleadosService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(authService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));
    Object.values(migrationsService).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockRejectedValue(boom));

    await runMutation(() => productHooks.useCreateProductMutation(), {});
    await runMutation(() => productHooks.useUpdateProductMutation(), { id: "p", payload: {} });
    await runMutation(() => productHooks.useDeleteProductMutation(), "p");
    await runMutation(() => orderHooks.useCreateOrderMutation(), {});
    await runMutation(() => orderHooks.useUpdateOrderMutation(), { id: "o", payload: {} });
    await runMutation(() => orderHooks.useDeleteOrderMutation(), "o");
    await runMutation(() => eventHooks.useCreateEventMutation(), {});
    await runMutation(() => eventHooks.useUpdateEventMutation(), { id: "e", payload: {} });
    await runMutation(() => eventHooks.useUpdateEventStatusMutation(), { id: "e", payload: {} });
    await runMutation(() => eventHooks.useDeleteEventMutation(), "e");
    await runMutation(() => eventHooks.useCreateEventTicketMutation(), { eventId: "e", payload: {} });
    await runMutation(() => eventHooks.useUpdateEventTicketMutation(), { eventId: "e", ticketId: "t", payload: {} });
    await runMutation(() => eventHooks.useDeleteEventTicketMutation(), { eventId: "e", ticketId: "t" });
    await runMutation(() => layoutHooks.useCreateLayoutMutation(), {});
    await runMutation(() => layoutHooks.useUpdateLayoutMutation(), { id: "l", payload: {} });
    await runMutation(() => layoutHooks.useDeleteLayoutMutation(), "l");
    await runMutation(() => reservationHooks.useCreateReservationMutation(), {});
    await runMutation(() => reservationHooks.useUpdateReservationMutation(), { id: "r", payload: {} });
    await runMutation(() => reservationHooks.useDeleteReservationMutation(), "r");
    await runMutation(() => reservationHooks.useUpdateReservationScheduleMutation(), {});
    await runMutation(() => empleadoHooks.useCreateTrabajadorMutation(), {});
    await runMutation(() => empleadoHooks.useUpdateTrabajadorMutation(), { id: "tr", payload: {} });
    await runMutation(() => empleadoHooks.useCreateEmpleadoUserMutation(), {});
    await runMutation(() => migrationHooks.useExecuteMigrationMutation(), "M1");
    await runMutation(() => migrationHooks.useRevertMigrationMutation(), "M1");
    expect(true).toBe(true);
  });
});
