import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicEventPagoView } from "./PublicEventPagoView";
import { usePurchaseStore } from "../../../store/purchaseStore";
import type { PublicEventDetail, PublicEventDetailSession } from "../../../core/api/publicEvents.types";

const payEvent = vi.hoisted(() => vi.fn());

vi.mock("../../../core/api/payments.hooks", () => ({
  usePayEventMutation: () => ({
    mutateAsync: payEvent,
    isPending: false,
  }),
}));

// Mock del Brick: expone un botón que dispara onSubmit con datos MP simulados.
vi.mock("@mercadopago/sdk-react", () => ({
  initMercadoPago: vi.fn(),
  CardPayment: ({ onSubmit }: any) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          token: "tok",
          installments: 1,
          payment_method_id: "visa",
          issuer_id: "310",
          payer: { email: "ana@correo.cl" },
        })
      }
    >
      brick-submit
    </button>
  ),
}));

const event = { id: "e1", title: "Cata", startsAt: "2026-08-01T10:00:00Z" } as unknown as PublicEventDetail;

const session = {
  id: "s1",
  date: "2026-08-01",
  startTime: "10:00",
  endTime: null,
  name: null,
} as unknown as PublicEventDetailSession;

const renderView = () => {
  render(
    <MemoryRouter initialEntries={["/publico/eventos/e1/pago"]}>
      <Routes>
        <Route path="/publico/eventos/:id/pago" element={<PublicEventPagoView />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("PublicEventPagoView pago MP", () => {
  beforeEach(() => {
    usePurchaseStore.getState().reset();
    usePurchaseStore.getState().setContext(event, null);
    usePurchaseStore.getState().addItems([
      { id: "c1", ticketTypeId: "t1", ticketTypeName: "General", attendeeFirstName: "Ana", attendeeLastName: "P", unitPrice: 5000, menuExtraPrice: 0 },
    ]);
    payEvent.mockClear();
    payEvent.mockResolvedValue({
      status: "approved",
      statusDetail: "ok",
      purchase: { eventId: "e1", eventTitle: "Cata", buyerEmail: "ana@correo.cl", total: 5000, tickets: [] },
    });
  });

  it("shows items and total, and renders the card payment brick", () => {
    renderView();
    expect(screen.getByText(/Ana P/)).toBeInTheDocument();
    expect(screen.getByText("$5.000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "brick-submit" })).toBeInTheDocument();
  });

  it("envía token del brick al backend con buyerEmail, ticketTypeId, attendanceDate y sin sessionId para un evento sin sesión", async () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() => expect(payEvent).toHaveBeenCalledTimes(1));
    const [payload] = payEvent.mock.calls[0];
    expect(payload).toEqual(
      expect.objectContaining({
        buyerEmail: "ana@correo.cl",
        items: [
          expect.objectContaining({
            ticketTypeId: "t1",
            attendeeFirstName: "Ana",
            attendeeLastName: "P",
            attendanceDate: "2026-08-01",
          }),
        ],
        payment: {
          token: "tok",
          installments: 1,
          paymentMethodId: "visa",
          issuerId: "310",
        },
      }),
    );
    expect(payload.items[0].sessionId).toBeUndefined();
  });

  it("envía sessionId y no attendanceDate para un evento con sesión", async () => {
    usePurchaseStore.getState().reset();
    usePurchaseStore.getState().setContext(event, session);
    usePurchaseStore.getState().addItems([
      { id: "c2", ticketTypeId: "t2", ticketTypeName: "VIP", attendeeFirstName: "Beto", attendeeLastName: "Q", unitPrice: 8000, menuExtraPrice: 0 },
    ]);
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() => expect(payEvent).toHaveBeenCalledTimes(1));
    const [payload] = payEvent.mock.calls[0];
    expect(payload.items).toHaveLength(1);
    const [item] = payload.items;
    expect(item).toEqual(
      expect.objectContaining({
        ticketTypeId: "t2",
        sessionId: "s1",
      }),
    );
    expect(item.attendanceDate).toBeUndefined();
  });

  it("muestra el panel de éxito cuando el pago es aprobado", async () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() => expect(screen.getByText("¡Reserva confirmada!")).toBeInTheDocument());
  });

  it("muestra snackbar de pendiente cuando el status es pending", async () => {
    payEvent.mockResolvedValue({ status: "pending", statusDetail: "in_process", purchase: null });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() => expect(payEvent).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("¡Reserva confirmada!")).not.toBeInTheDocument();
  });

  it("muestra snackbar de rechazo cuando el status es rejected", async () => {
    payEvent.mockResolvedValue({ status: "rejected", statusDetail: "cc_rejected_bad_filled_card_number", purchase: null });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() => expect(payEvent).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("¡Reserva confirmada!")).not.toBeInTheDocument();
  });
});
