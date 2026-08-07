import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const m = vi.hoisted(() => () => ({ mutateAsync: vi.fn(), isPending: false }));
const q = vi.hoisted(() => () => ({ data: [], isLoading: false }));
// Estado mutable leído por el mock de useCreateQrCheckoutMutation en cada
// render: permite simular "cobro en creación" (isPending: true) sin tener
// que reescribir vi.mock por test, ya que las factories quedan elevadas.
const createQrCheckoutState = vi.hoisted(() => ({ isPending: false }));
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
    mutateAsync: vi.fn(),
    isPending: createQrCheckoutState.isPending,
  }),
  useCancelQrCheckoutMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("./QrCheckoutPanel/QrCheckoutPanel", () => ({
  QrCheckoutPanel: () => <div data-testid="qr-panel" />,
}));
vi.mock("../../store/snackBarStore", () => ({
  useSnackBarResponseStore: (selector: (s: { openSnackbar: () => void }) => unknown) =>
    selector({ openSnackbar: vi.fn() }),
}));
vi.mock("../../components/ui/imageUpload/ImageUploadField", () => ({
  ImageUploadField: () => null,
}));
vi.mock("../../components/ui/calendar/CustomCalendarV2", () => ({
  CustomCalendarV2: () => null,
}));

import { EventsTicketsView } from "./EventsTicketsView";

describe("EventsTicketsView", () => {
  afterEach(() => {
    createQrCheckoutState.isPending = false;
  });

  it("renderiza la cabecera de gestion", () => {
    render(<EventsTicketsView />);
    expect(screen.getByText("Gestion de Eventos y Tickets")).toBeInTheDocument();
  });

  it("el selector de medio de pago incluye MercadoPago (QR)", async () => {
    render(<EventsTicketsView />);

    fireEvent.click(await screen.findByLabelText("Tickets"));
    fireEvent.mouseDown(await screen.findByLabelText("Medio de pago"));

    expect(
      await screen.findByRole("option", { name: /mercadopago \(qr\)/i }),
    ).toBeInTheDocument();
  });

  it("no permite cerrar el modal mientras se está generando el QR", async () => {
    createQrCheckoutState.isPending = true;

    render(<EventsTicketsView />);

    fireEvent.click(await screen.findByLabelText("Tickets"));

    expect(screen.getByRole("button", { name: /cerrar/i })).toBeDisabled();
  });
});
