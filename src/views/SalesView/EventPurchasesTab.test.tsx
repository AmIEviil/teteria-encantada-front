import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  EventPurchaseDetail,
  EventPurchaseRow,
} from "../../core/api/types";

const mocks = vi.hoisted(() => ({
  useEventPurchasesQuery: vi.fn(),
  useEventPurchaseDetailQuery: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock("../../core/api/eventPurchases.hooks", () => ({
  useEventPurchasesQuery: mocks.useEventPurchasesQuery,
  useEventPurchaseDetailQuery: mocks.useEventPurchaseDetailQuery,
}));
vi.mock("../../core/api/eventPurchases.service", () => ({
  eventPurchasesService: { downloadFile: mocks.downloadFile },
}));
vi.mock("../../core/api/events.hooks", () => ({
  useEventsQuery: () => ({ data: [{ id: "ev1", title: "Taller" }] }),
}));

import { EventPurchasesTab } from "./EventPurchasesTab";

const row = (over: Partial<EventPurchaseRow> = {}): EventPurchaseRow => ({
  id: "p1",
  createdAt: "2026-10-01T15:00:00Z",
  buyerEmail: "ana@mail.cl",
  buyerDisplayName: "Ana Pérez",
  eventId: "ev1",
  eventTitle: "Taller",
  ticketsCount: 2,
  total: 20000,
  status: "PAID",
  origin: "PUBLIC",
  mpPaymentId: "123456789012",
  manualPaymentMethod: null,
  ...over,
});

const detail = (over: Partial<EventPurchaseDetail> = {}): EventPurchaseDetail => ({
  ...row(),
  mpPayerId: null,
  paidAt: "2026-10-01T15:05:00Z",
  mpPaymentMethod: "visa",
  attendees: [],
  hasTicketsFile: true,
  hasReceiptFile: true,
  otherPurchases: [],
  ...over,
});

let currentDetail: EventPurchaseDetail | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  currentDetail = detail();
  mocks.useEventPurchasesQuery.mockReturnValue({
    data: {
      items: [row()],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      totals: { totalPurchases: 1, paidPurchases: 1, paidAmount: 20000 },
    },
    isLoading: false,
    isFetching: false,
  });
  mocks.useEventPurchaseDetailQuery.mockImplementation((id: string | null) => ({
    data: id ? currentDetail : undefined,
    isLoading: false,
    isError: false,
  }));
});

const openDetail = () => fireEvent.click(screen.getByText("Ver detalle"));

describe("EventPurchasesTab", () => {
  it("consulta con status PAID en el primer render", () => {
    render(<EventPurchasesTab />);
    expect(mocks.useEventPurchasesQuery.mock.calls[0][0]).toMatchObject({
      status: "PAID",
    });
  });

  it("buscar 'ana' re-consulta con search y page 1", async () => {
    render(<EventPurchasesTab />);
    fireEvent.change(screen.getByPlaceholderText("Nombre o email del comprador"), {
      target: { value: "ana" },
    });
    await waitFor(() => {
      const last = mocks.useEventPurchasesQuery.mock.calls.at(-1)![0];
      expect(last).toMatchObject({ search: "ana", page: 1 });
    });
  });

  it("muestra nombre y email del comprador", () => {
    render(<EventPurchasesTab />);
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana@mail.cl")).toBeInTheDocument();
  });

  it("abre el detalle con Pago MP y su id", () => {
    render(<EventPurchasesTab />);
    openDetail();
    expect(screen.getByText(/Pago MP/)).toBeInTheDocument();
    expect(screen.getByText(/123456789012/)).toBeInTheDocument();
    expect(screen.getByText("No informado")).toBeInTheDocument();
  });

  it("lista otras compras y 'ver' consulta el detalle de ese id", () => {
    currentDetail = detail({
      otherPurchases: [
        row({ id: "p2", eventTitle: "Cena" }),
        row({ id: "p3", eventTitle: "Brunch" }),
      ],
    });
    render(<EventPurchasesTab />);
    openDetail();
    expect(
      screen.getByText("Otras compras de esta persona (2)"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("ver")[0]);
    expect(mocks.useEventPurchaseDetailQuery).toHaveBeenLastCalledWith("p2");
  });

  it("sin otras compras muestra el texto vacio", () => {
    render(<EventPurchasesTab />);
    openDetail();
    expect(screen.getByText("Sin otras compras")).toBeInTheDocument();
  });

  it("compra manual muestra Manual · EFECTIVO", () => {
    currentDetail = detail({
      mpPaymentId: null,
      manualPaymentMethod: "EFECTIVO",
    });
    render(<EventPurchasesTab />);
    openDetail();
    expect(screen.getAllByText(/Manual · EFECTIVO/).length).toBeGreaterThan(0);
  });

  it("sin comprobante archivado deshabilita el boton", () => {
    currentDetail = detail({ hasReceiptFile: false });
    render(<EventPurchasesTab />);
    openDetail();
    expect(
      screen.getByRole("button", { name: "Descargar comprobante (PDF)" }),
    ).toBeDisabled();
    expect(screen.getByText("no archivado")).toBeInTheDocument();
  });

  it("descargar tickets llama al servicio", () => {
    render(<EventPurchasesTab />);
    openDetail();
    fireEvent.click(
      screen.getByRole("button", { name: "Descargar tickets (PDF)" }),
    );
    expect(mocks.downloadFile).toHaveBeenCalledWith("p1", "tickets");
  });

  it("muestra asistentes con tipo de entrada", () => {
    currentDetail = detail({
      attendees: [
        { firstName: "Ana", lastName: "Pérez", ticketTypeName: "General", attendanceDate: null, sessionId: null },
        { firstName: "Juan", lastName: "Pérez", ticketTypeName: null, attendanceDate: null, sessionId: null },
      ],
    });
    render(<EventPurchasesTab />);
    openDetail();
    expect(
      screen.getByText(/Ana Pérez \(General\), Juan Pérez$/),
    ).toBeInTheDocument();
  });

  it("la linea Fecha pago incluye medio y estado", () => {
    render(<EventPurchasesTab />);
    openDetail();
    expect(screen.getByText(/Fecha pago:/).closest("p")!.textContent).toMatch(
      / · visa · Pagada$/,
    );
  });

  it("muestra error si falla la carga del detalle", () => {
    mocks.useEventPurchaseDetailQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      isError: true,
    }));
    render(<EventPurchasesTab />);
    openDetail();
    expect(screen.getByText("No se pudo cargar el detalle")).toBeInTheDocument();
  });

  it("singular '1 entrada' en otras compras", () => {
    currentDetail = detail({
      otherPurchases: [row({ id: "p2", ticketsCount: 1 })],
    });
    render(<EventPurchasesTab />);
    openDetail();
    expect(screen.getByText(/ · 1 entrada · /)).toBeInTheDocument();
  });

  it("limpia el error de descarga al cambiar de compra", async () => {
    mocks.downloadFile.mockRejectedValueOnce(new Error("x"));
    currentDetail = detail({
      otherPurchases: [row({ id: "p2", eventTitle: "Cena" })],
    });
    render(<EventPurchasesTab />);
    openDetail();
    fireEvent.click(
      screen.getByRole("button", { name: "Descargar tickets (PDF)" }),
    );
    await screen.findByText("No se pudo descargar el archivo");
    fireEvent.click(screen.getByText("ver"));
    await waitFor(() =>
      expect(
        screen.queryByText("No se pudo descargar el archivo"),
      ).not.toBeInTheDocument(),
    );
  });
});
