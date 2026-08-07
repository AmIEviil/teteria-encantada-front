import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const m = vi.hoisted(() => () => ({ mutateAsync: vi.fn(), isPending: false }));
const q = vi.hoisted(() => () => ({ data: [], isLoading: false }));
// Estado mutable leído por el mock de useCreateQrCheckoutMutation en cada
// render: permite simular "cobro en creación" (isPending: true) sin tener
// que reescribir vi.mock por test, ya que las factories quedan elevadas.
const createQrCheckoutState = vi.hoisted(() => ({ isPending: false }));
// Checkout devuelto por el mock de useCreateQrCheckoutMutation al "crear" un
// cobro QR: permite llevar a activeQrCheckout a un estado truthy en los
// tests sin depender del backend real.
const fakeQrCheckout = vi.hoisted(() => ({
  purchaseId: "qr-purchase-1",
  checkoutUrl: "https://mp.test/c/1",
  total: 10000,
  expiresAt: "2026-08-06T21:15:00.000Z",
  status: "PENDING",
}));
const createQrCheckoutMutate = vi.hoisted(() =>
  vi.fn().mockResolvedValue(fakeQrCheckout),
);
const cancelQrCheckoutMutate = vi.hoisted(() => vi.fn().mockResolvedValue({ status: "CANCELLED" }));
// Spy estable del snackbar: el selector de zustand se re-invoca en cada
// render, así que sin hoisted quedaría un vi.fn() distinto por render y los
// tests no podrían verificar qué mensaje se mostró.
const openSnackbarMock = vi.hoisted(() => vi.fn());
const eventsQuery = vi.hoisted(() => () => ({
  data: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Evento de prueba",
      status: "ENABLED",
      startsAt: "2026-09-01T18:00:00",
      endsAt: "2026-09-01T23:00:00",
      totalTickets: 100,
      soldTickets: 0,
      hasSessions: false,
      ticketTypes: [{ id: "tt1", name: "General", price: 10000, dailyStocks: [] }],
      sessions: [],
    },
  ],
  isLoading: false,
}));

vi.mock("../../core/api/events.hooks", () => ({
  useEventsQuery: eventsQuery,
  useEventTicketsQuery: q,
  useCreateEventMutation: m,
  useUpdateEventMutation: m,
  useDeleteEventMutation: m,
  useCreateEventTicketMutation: m,
  useCreateEventPurchaseMutation: m,
  useUpdateEventTicketMutation: m,
  useDeleteEventTicketMutation: m,
}));
vi.mock("../../core/api/payments.hooks", () => ({
  useCreateQrCheckoutMutation: () => ({
    mutateAsync: createQrCheckoutMutate,
    isPending: createQrCheckoutState.isPending,
  }),
  useCancelQrCheckoutMutation: () => ({
    mutateAsync: cancelQrCheckoutMutate,
    isPending: false,
  }),
}));
// El panel real depende de sockets y polling (ver QrCheckoutPanel.test.tsx,
// que lo cubre por su cuenta); acá sólo interesa que EventsTicketsView
// reaccione bien a onSettled, así que se reemplaza por botones que lo
// invocan con cada estado posible.
vi.mock("./QrCheckoutPanel/QrCheckoutPanel", () => ({
  QrCheckoutPanel: ({
    onSettled,
  }: {
    onSettled: (status: "PAID" | "REJECTED" | "EXPIRED" | "CANCELLED") => void;
  }) => (
    <div data-testid="qr-panel">
      <button onClick={() => onSettled("PAID")}>settle-paid</button>
      <button onClick={() => onSettled("REJECTED")}>settle-rejected</button>
      <button onClick={() => onSettled("EXPIRED")}>settle-expired</button>
    </div>
  ),
}));
vi.mock("../../store/snackBarStore", () => ({
  useSnackBarResponseStore: (
    selector: (s: { openSnackbar: typeof openSnackbarMock }) => unknown,
  ) => selector({ openSnackbar: openSnackbarMock }),
}));
vi.mock("../../components/ui/imageUpload/ImageUploadField", () => ({
  ImageUploadField: () => null,
}));
vi.mock("../../components/ui/calendar/CustomCalendarV2", () => ({
  CustomCalendarV2: () => null,
}));

import { EventsTicketsView } from "./EventsTicketsView";

// EventsTicketsView usa useQueryClient() (Arreglo 5: invalidar ["events"] y
// ["event-tickets"] cuando se paga un cobro QR), así que necesita un
// QueryClient real de verdad en el árbol. Se expone el propio client para
// poder espiar invalidateQueries.
const renderView = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  render(
    <QueryClientProvider client={queryClient}>
      <EventsTicketsView />
    </QueryClientProvider>,
  );
  return { queryClient, invalidateSpy };
};

// Lleva el modal de tickets hasta que se muestra el panel de QR (mockeado):
// completa comprador, medio de pago MercadoPago (QR) y datos del asistente,
// y envía el formulario. Es el mismo camino que recorre el operador real.
const openQrCheckoutPanel = async () => {
  fireEvent.click(await screen.findByLabelText("Tickets"));

  fireEvent.change(await screen.findByLabelText("Email del comprador"), {
    target: { value: "comprador@test.cl" },
  });

  fireEvent.mouseDown(screen.getByLabelText("Medio de pago"));
  fireEvent.click(await screen.findByRole("option", { name: /mercadopago \(qr\)/i }));

  fireEvent.change(screen.getByLabelText("Nombres"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "Perez" } });

  fireEvent.click(screen.getByRole("button", { name: /^registrar tickets$/i }));

  return screen.findByTestId("qr-panel");
};

describe("EventsTicketsView", () => {
  afterEach(() => {
    createQrCheckoutState.isPending = false;
    createQrCheckoutMutate.mockClear();
    cancelQrCheckoutMutate.mockClear();
    openSnackbarMock.mockClear();
  });

  it("renderiza la cabecera de gestion", () => {
    renderView();
    expect(screen.getByText("Gestion de Eventos y Tickets")).toBeInTheDocument();
  });

  it("el selector de medio de pago incluye MercadoPago (QR)", async () => {
    renderView();

    fireEvent.click(await screen.findByLabelText("Tickets"));
    fireEvent.mouseDown(await screen.findByLabelText("Medio de pago"));

    expect(
      await screen.findByRole("option", { name: /mercadopago \(qr\)/i }),
    ).toBeInTheDocument();
  });

  it("no permite cerrar el modal mientras se está generando el QR", async () => {
    createQrCheckoutState.isPending = true;

    renderView();

    fireEvent.click(await screen.findByLabelText("Tickets"));

    expect(screen.getByRole("button", { name: /cerrar/i })).toBeDisabled();
  });

  it("cuando el cobro QR se paga, invalida eventos y tickets y confirma la entrega", async () => {
    const { invalidateSpy } = renderView();
    await openQrCheckoutPanel();

    fireEvent.click(screen.getByRole("button", { name: /settle-paid/i }));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["events"] });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["event-tickets"] });
    expect(openSnackbarMock).toHaveBeenCalledWith(
      "Pago aprobado, tickets emitidos",
      "success",
    );
    // El panel se desmonta apenas se liquida: no debe quedar QR en pantalla.
    expect(screen.queryByTestId("qr-panel")).not.toBeInTheDocument();
  });

  it("el pago rechazado muestra su propio mensaje, no el de cancelado", async () => {
    renderView();
    await openQrCheckoutPanel();

    fireEvent.click(screen.getByRole("button", { name: /settle-rejected/i }));

    await waitFor(() => {
      expect(openSnackbarMock).toHaveBeenCalledWith("El pago fue rechazado", "info");
    });
  });

  it("si falla la cancelación al cerrar con un cobro QR activo, el modal se queda abierto", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    cancelQrCheckoutMutate.mockRejectedValueOnce(new Error("red caída"));

    renderView();
    await openQrCheckoutPanel();

    fireEvent.click(screen.getByRole("button", { name: /^cerrar$/i }));

    await waitFor(() => expect(cancelQrCheckoutMutate).toHaveBeenCalled());
    // El cobro sigue vivo si la cancelación no se aplicó: el modal no debe
    // cerrarse como si nada, para que el operador vea el QR y pueda
    // reintentar la cancelación.
    expect(screen.getByTestId("qr-panel")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
