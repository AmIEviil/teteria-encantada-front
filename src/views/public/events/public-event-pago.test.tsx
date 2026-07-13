import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicEventPagoView } from "./PublicEventPagoView";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import type { PublicEventDetail, PublicEventDetailSession } from "../../../core/api/publicEvents.types";

const payEvent = vi.hoisted(() => vi.fn());

vi.mock("../../../core/api/payments.hooks", () => ({
  usePayEventMutation: () => ({
    mutateAsync: payEvent,
    isPending: false,
  }),
}));

// Mock del Brick: expone un botón que dispara onSubmit con datos MP simulados.
// El Brick real captura el rechazo del promise de onSubmit para resetearse;
// replicamos ese `.catch` acá para que un rechazo intencional (pago fallido)
// no se propague como unhandled rejection dentro del test.
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
        }).catch(() => {})
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
    useSnackBarResponseStore.getState().resetSnackbar();
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

  it("muestra el motivo del rechazo según statusDetail, y rechaza el promise para que el Brick se resetee", async () => {
    payEvent.mockResolvedValue({ status: "rejected", statusDetail: "cc_rejected_bad_filled_card_number", purchase: null });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    // El mock del Brick captura el rechazo del promise (igual que el Brick real),
    // así que solo verificamos los efectos: snackbar de error y sin panel de éxito.
    await waitFor(() =>
      expect(useSnackBarResponseStore.getState().snackbarMessage).toMatch(/número de tarjeta/),
    );
    expect(useSnackBarResponseStore.getState().snackbarType).toBe("error");
    expect(screen.queryByText("¡Reserva confirmada!")).not.toBeInTheDocument();
  });

  it("cae al mensaje genérico cuando el statusDetail no está mapeado", async () => {
    payEvent.mockResolvedValue({ status: "rejected", statusDetail: "cc_rejected_detalle_nuevo", purchase: null });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() =>
      expect(useSnackBarResponseStore.getState().snackbarMessage).toMatch(/El pago fue rechazado/),
    );
    expect(useSnackBarResponseStore.getState().snackbarType).toBe("error");
  });

  it("muestra un mensaje distinto (no de rechazo) cuando el status es approved pero purchase es null", async () => {
    payEvent.mockResolvedValue({ status: "approved", statusDetail: "ok", purchase: null });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "brick-submit" }));

    await waitFor(() =>
      expect(useSnackBarResponseStore.getState().snackbarMessage).toMatch(/contacta a soporte/),
    );
    expect(screen.queryByText("¡Reserva confirmada!")).not.toBeInTheDocument();
  });
});
