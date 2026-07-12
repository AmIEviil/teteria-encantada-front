import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

import apiClient from "../client/client";
import { authService } from "./auth.service";
import { empleadosService } from "./empleados.service";
import { eventsService } from "./events.service";
import { imagesService } from "./images.service";
import { layoutsService } from "./layouts.service";
import { migrationsService } from "./migrations.service";
import { ordersService } from "./orders.service";
import { productsService } from "./products.service";
import { publicService } from "./public.service";
import { reservationsService } from "./reservations.service";
import { tablesService } from "./tables.service";

const mock = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

const resolve = (data: unknown) => ({ data });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService", () => {
  it("login/register/forgot/reset/profile/roles/createUser", async () => {
    mock.post.mockResolvedValue(resolve({ accessToken: "t" }));
    mock.get.mockResolvedValue(resolve([{ id: "r" }]));
    expect((await authService.login({} as never)).accessToken).toBe("t");
    await authService.register({} as never);
    await authService.forgotPassword({} as never);
    await authService.resetPassword({} as never);
    mock.get.mockResolvedValueOnce(resolve({ id: "u" }));
    expect((await authService.profile()).id).toBe("u");
    await authService.roles();
    await authService.createUser({} as never);
    expect(mock.post).toHaveBeenCalledWith("/auth/login", {});
  });
});

describe("productsService", () => {
  it("findAll array", async () => {
    mock.get.mockResolvedValue(resolve([{ id: "p" }]));
    expect(await productsService.findAll()).toHaveLength(1);
  });
  it("findAll {data}", async () => {
    mock.get.mockResolvedValue(resolve({ data: [{ id: "p" }] }));
    expect(await productsService.findAll()).toHaveLength(1);
  });
  it("findAll {items}", async () => {
    mock.get.mockResolvedValue(resolve({ items: [{ id: "p" }] }));
    expect(await productsService.findAll()).toHaveLength(1);
  });
  it("findAll fallback", async () => {
    mock.get.mockResolvedValue(resolve("nope"));
    expect(await productsService.findAll()).toEqual([]);
  });
  it("findOne/create/update/remove", async () => {
    mock.get.mockResolvedValue(resolve({ id: "p" }));
    mock.post.mockResolvedValue(resolve({ id: "p" }));
    mock.patch.mockResolvedValue(resolve({ id: "p" }));
    mock.delete.mockResolvedValue(resolve({ message: "ok" }));
    await productsService.findOne("p");
    await productsService.create({} as never);
    await productsService.update("p", {} as never);
    expect((await productsService.remove("p")).message).toBe("ok");
  });
});

describe("eventsService", () => {
  it("findAll array/{data}/fallback", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "e" }]));
    expect(await eventsService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "e" }] }));
    expect(await eventsService.findAll({ status: "ENABLED" } as never)).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await eventsService.findAll()).toEqual([]);
  });
  it("tickets array/{data}/fallback", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "t" }]));
    expect(await eventsService.findTickets("e")).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "t" }] }));
    expect(await eventsService.findTickets("e", {} as never)).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await eventsService.findTickets("e")).toEqual([]);
  });
  it("crud", async () => {
    mock.get.mockResolvedValue(resolve({ id: "e" }));
    mock.post.mockResolvedValue(resolve({ id: "e" }));
    mock.patch.mockResolvedValue(resolve({ id: "e" }));
    mock.delete.mockResolvedValue(resolve({ message: "ok" }));
    await eventsService.findOne("e");
    await eventsService.create({} as never);
    await eventsService.update("e", {} as never);
    await eventsService.updateStatus("e", {} as never);
    await eventsService.remove("e");
    await eventsService.createTicket("e", {} as never);
    await eventsService.updateTicket("e", "t", {} as never);
    await eventsService.removeTicket("e", "t");
    expect(mock.delete).toHaveBeenCalled();
  });
});

describe("imagesService", () => {
  it("upload usa FormData", async () => {
    mock.post.mockResolvedValue(resolve({ id: "i", url: "u" }));
    const file = new File(["x"], "x.png", { type: "image/png" });
    expect((await imagesService.upload(file)).id).toBe("i");
  });
});

describe("layoutsService", () => {
  it("findAll branches", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "l" }]));
    expect(await layoutsService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "l" }] }));
    expect(await layoutsService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await layoutsService.findAll()).toEqual([]);
  });
  it("crud + snapshots", async () => {
    mock.get.mockResolvedValue(resolve({ id: "l" }));
    mock.post.mockResolvedValue(resolve({ id: "l" }));
    mock.patch.mockResolvedValue(resolve({ id: "l" }));
    mock.delete.mockResolvedValue(resolve({ message: "ok" }));
    await layoutsService.findOne("l");
    await layoutsService.create({} as never);
    await layoutsService.update("l", {} as never);
    await layoutsService.createSnapshot({} as never);
    await layoutsService.saveSnapshot("l", {} as never);
    await layoutsService.remove("l");
    expect(mock.post).toHaveBeenCalledWith("/layouts/snapshot", {});
  });
});

describe("ordersService", () => {
  it("findAll branches", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "o" }]));
    expect(await ordersService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "o" }] }));
    expect(await ordersService.findAll({ tableId: "t" } as never)).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ items: [{ id: "o" }] }));
    expect(await ordersService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await ordersService.findAll()).toEqual([]);
  });
  it("report valido y fallback", async () => {
    mock.get.mockResolvedValueOnce(
      resolve({
        items: [],
        pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
        monthlySummary: [],
        totals: {
          totalOrders: 0,
          paidOrders: 0,
          cancelledOrders: 0,
          totalSales: 0,
          paidSales: 0,
        },
      }),
    );
    expect((await ordersService.findReport()).pagination.page).toBe(1);
    mock.get.mockResolvedValueOnce(resolve("bad"));
    expect((await ordersService.findReport({ page: 2 } as never)).pagination.page).toBe(2);
  });
  it("crud", async () => {
    mock.post.mockResolvedValue(resolve({ id: "o" }));
    mock.patch.mockResolvedValue(resolve({ id: "o" }));
    mock.delete.mockResolvedValue(resolve({ message: "ok" }));
    await ordersService.create({} as never);
    await ordersService.update("o", {} as never);
    await ordersService.remove("o");
    expect(mock.delete).toHaveBeenCalled();
  });
});

describe("publicService", () => {
  it("menu/tables/reservations/schedule + create", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "m" }]));
    expect(await publicService.findMenu()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "t" }] }));
    expect(await publicService.findTables()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ items: [{ id: "r" }] }));
    expect(await publicService.findReservations({ email: "a@b.com" } as never)).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await publicService.findReservationSchedule()).toEqual([]);
    mock.post.mockResolvedValue(resolve({ id: "r" }));
    expect((await publicService.createReservation({} as never)).id).toBe("r");
  });
});

describe("tablesService", () => {
  it("findAll branches + crud", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "t" }]));
    expect(await tablesService.findAll("l")).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "t" }] }));
    expect(await tablesService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ items: [{ id: "t" }] }));
    expect(await tablesService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await tablesService.findAll()).toEqual([]);
    mock.get.mockResolvedValue(resolve({ id: "t" }));
    mock.post.mockResolvedValue(resolve({ id: "t" }));
    mock.patch.mockResolvedValue(resolve({ id: "t" }));
    mock.delete.mockResolvedValue(resolve({ message: "ok" }));
    await tablesService.findOne("t");
    await tablesService.create({} as never);
    await tablesService.update("t", {} as never);
    await tablesService.remove("t");
    expect(mock.delete).toHaveBeenCalled();
  });
});

describe("reservationsService", () => {
  it("findAll branches + crud + schedule", async () => {
    mock.get.mockResolvedValueOnce(resolve([{ id: "r" }]));
    expect(await reservationsService.findAll()).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve({ data: [{ id: "r" }] }));
    expect(await reservationsService.findAll({ tableId: "t" } as never)).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve(null));
    expect(await reservationsService.findAll()).toEqual([]);
    mock.get.mockResolvedValue(resolve({ id: "r" }));
    mock.post.mockResolvedValue(resolve({ id: "r" }));
    mock.patch.mockResolvedValue(resolve({ id: "r" }));
    mock.delete.mockResolvedValue(resolve({ message: "ok" }));
    mock.put.mockResolvedValue(resolve([{ dayOfWeek: 1 }]));
    await reservationsService.findOne("r");
    await reservationsService.create({} as never);
    await reservationsService.update("r", {} as never);
    await reservationsService.remove("r");
    await reservationsService.findSchedule();
    await reservationsService.updateSchedule({} as never);
    expect(mock.put).toHaveBeenCalled();
  });
});

describe("empleadosService", () => {
  it("findUsers valido y fallback", async () => {
    mock.get.mockResolvedValueOnce(
      resolve({
        items: [{ id: "u" }],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      }),
    );
    expect((await empleadosService.findUsers()).items).toHaveLength(1);
    mock.get.mockResolvedValueOnce(resolve("bad"));
    expect((await empleadosService.findUsers({ page: 3 } as never)).pagination.page).toBe(3);
  });
  it("crud", async () => {
    mock.get.mockResolvedValue(resolve({ id: "tr" }));
    mock.post.mockResolvedValue(resolve({ id: "tr" }));
    mock.patch.mockResolvedValue(resolve({ id: "tr" }));
    await empleadosService.create({} as never);
    await empleadosService.findOne("tr");
    await empleadosService.update("tr", {} as never);
    expect(mock.patch).toHaveBeenCalled();
  });
});

describe("migrationsService", () => {
  it("getStatus normaliza", async () => {
    mock.get.mockResolvedValueOnce(
      resolve({
        executed: [{ name: "M1", timestamp: 123 }, { name: "" }],
        pending: [{ name: "M2", timestamp: "456" }],
        order: "desc",
        summary: { totalExecuted: 1, totalPending: 1, totalMigrations: 2 },
      }),
    );
    const status = await migrationsService.getStatus("desc");
    expect(status.executed).toHaveLength(1);
    expect(status.order).toBe("desc");
  });
  it("getStatus fallback + defaults de summary", async () => {
    mock.get.mockResolvedValueOnce(resolve(null));
    expect((await migrationsService.getStatus("asc")).summary.totalMigrations).toBe(0);
    mock.get.mockResolvedValueOnce(
      resolve({ executed: [{ name: "M1" }], pending: [] }),
    );
    const s = await migrationsService.getStatus("asc");
    expect(s.summary.totalExecuted).toBe(1);
  });
  it("getHistory normaliza y filtra", async () => {
    mock.get.mockResolvedValueOnce(
      resolve([
        {
          id: "1",
          migrationName: "M1",
          action: "REVERT",
          executedAt: "2026-01-01",
          success: true,
          user: { id: "u" },
          details: { a: 1 },
        },
        { id: "" },
      ]),
    );
    const history = await migrationsService.getHistory("M1");
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("REVERT");
    mock.get.mockResolvedValueOnce(resolve("bad"));
    expect(await migrationsService.getHistory()).toEqual([]);
  });
  it("acciones", async () => {
    mock.post.mockResolvedValue(resolve({ success: true }));
    await migrationsService.executeMigration("M1");
    await migrationsService.revertMigration("M1");
    await migrationsService.executeAllPending();
    await migrationsService.revertLastMigration();
    expect(mock.post).toHaveBeenCalledTimes(4);
  });
});
