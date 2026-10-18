import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";
import { eventPurchasesService } from "./eventPurchases.service";
import apiClient from "../client/client";

vi.mock("../client/client", () => ({ default: { get: vi.fn() } }));

describe("eventPurchasesService.findAll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia los filtros como params", async () => {
    (apiClient.get as unknown as Mock).mockResolvedValue({ data: { items: [] } });
    await eventPurchasesService.findAll({
      search: "ana",
      page: 1,
      limit: 10,
      status: "PAID",
    });
    expect(apiClient.get).toHaveBeenCalledWith("/event-purchases", {
      params: { search: "ana", page: 1, limit: 10, status: "PAID" },
    });
  });

  it("omite claves vacias", async () => {
    (apiClient.get as unknown as Mock).mockResolvedValue({ data: { items: [] } });
    await eventPurchasesService.findAll({ search: "" });
    expect(apiClient.get).toHaveBeenCalledWith("/event-purchases", { params: {} });
  });
});

describe("eventPurchasesService.findOne", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hace GET al detalle", async () => {
    (apiClient.get as unknown as Mock).mockResolvedValue({ data: { id: "p1" } });
    const res = await eventPurchasesService.findOne("p1");
    expect(apiClient.get).toHaveBeenCalledWith("/event-purchases/p1");
    expect(res.id).toBe("p1");
  });
});

describe("eventPurchasesService.downloadFile", () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let createObjectURL: Mock;
  let revokeObjectURL: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURL = vi.fn(() => "blob:fake");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it("descarga el blob con el nombre de Content-Disposition", async () => {
    const blob = new Blob(["pdf"]);
    (apiClient.get as unknown as Mock).mockResolvedValue({
      data: blob,
      headers: { "content-disposition": 'attachment; filename="123-comprobante.pdf"' },
    });
    const click = HTMLAnchorElement.prototype.click as unknown as Mock;
    let downloadName = "";
    click.mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });

    await eventPurchasesService.downloadFile("p1", "comprobante");

    expect(apiClient.get).toHaveBeenCalledWith("/event-purchases/p1/comprobante.pdf", {
      responseType: "blob",
    });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(downloadName).toBe("123-comprobante.pdf");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });

  it("usa nombre por defecto sin Content-Disposition", async () => {
    (apiClient.get as unknown as Mock).mockResolvedValue({
      data: new Blob(["pdf"]),
      headers: {},
    });
    const click = HTMLAnchorElement.prototype.click as unknown as Mock;
    let downloadName = "";
    click.mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });

    await eventPurchasesService.downloadFile("p1", "tickets");

    expect(downloadName).toBe("p1-tickets.pdf");
  });
});
