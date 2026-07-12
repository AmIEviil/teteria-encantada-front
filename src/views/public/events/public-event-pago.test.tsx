import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicEventPagoView } from "./PublicEventPagoView";
import { usePurchaseStore } from "../../../store/purchaseStore";
import type { PublicEventDetail, PublicEventDetailSession } from "../../../core/api/publicEvents.types";

const mutateMock = vi.hoisted(() => vi.fn());

vi.mock("../../../core/api/public.hooks", () => ({
  usePublicPurchaseMutation: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
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

describe("PublicEventPagoView", () => {
  beforeEach(() => {
    usePurchaseStore.getState().reset();
    usePurchaseStore.getState().setContext(event, null);
    usePurchaseStore.getState().addItems([
      { id: "c1", ticketTypeId: "t1", ticketTypeName: "General", attendeeFirstName: "Ana", attendeeLastName: "P", unitPrice: 5000, menuExtraPrice: 0 },
    ]);
    mutateMock.mockClear();
  });

  it("shows items and total, PAGAR disabled until valid email", () => {
    renderView();
    expect(screen.getByText(/Ana P/)).toBeInTheDocument();
    expect(screen.getByText("$5.000")).toBeInTheDocument();
    const pay = screen.getByRole("button", { name: "PAGAR" });
    expect(pay).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.cl"), {
      target: { value: "ana@correo.cl" },
    });
    expect(pay).not.toBeDisabled();
  });

  it("sends buyerEmail, ticketTypeId, attendanceDate and no sessionId for a no-session event", () => {
    renderView();
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.cl"), {
      target: { value: "ana@correo.cl" },
    });
    fireEvent.click(screen.getByRole("button", { name: "PAGAR" }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const [payload] = mutateMock.mock.calls[0];
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
      }),
    );
    expect(payload.items[0].sessionId).toBeUndefined();
  });

  it("sends sessionId and no attendanceDate for a session event", () => {
    usePurchaseStore.getState().reset();
    usePurchaseStore.getState().setContext(event, session);
    usePurchaseStore.getState().addItems([
      { id: "c2", ticketTypeId: "t2", ticketTypeName: "VIP", attendeeFirstName: "Beto", attendeeLastName: "Q", unitPrice: 8000, menuExtraPrice: 0 },
    ]);
    renderView();
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.cl"), {
      target: { value: "beto@correo.cl" },
    });
    fireEvent.click(screen.getByRole("button", { name: "PAGAR" }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const [payload] = mutateMock.mock.calls[0];
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
});
