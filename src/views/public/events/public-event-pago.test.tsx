import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicEventPagoView } from "./PublicEventPagoView";
import { usePurchaseStore } from "../../../store/purchaseStore";
import type { PublicEventDetail } from "../../../core/api/publicEvents.types";

vi.mock("../../../core/api/public.hooks", () => ({
  usePublicPurchaseMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const event = { id: "e1", title: "Cata", startsAt: "2026-08-01T10:00:00Z" } as unknown as PublicEventDetail;

describe("PublicEventPagoView", () => {
  beforeEach(() => {
    usePurchaseStore.getState().reset();
    usePurchaseStore.getState().setContext(event, null);
    usePurchaseStore.getState().addItems([
      { id: "c1", ticketTypeId: "t1", ticketTypeName: "General", attendeeFirstName: "Ana", attendeeLastName: "P", unitPrice: 5000, menuExtraPrice: 0 },
    ]);
  });

  it("shows items and total, PAGAR disabled until valid email", () => {
    render(
      <MemoryRouter initialEntries={["/publico/eventos/e1/pago"]}>
        <Routes>
          <Route path="/publico/eventos/:id/pago" element={<PublicEventPagoView />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Ana P/)).toBeInTheDocument();
    expect(screen.getByText("$5.000")).toBeInTheDocument();
    const pay = screen.getByRole("button", { name: "PAGAR" });
    expect(pay).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.cl"), {
      target: { value: "ana@correo.cl" },
    });
    expect(pay).not.toBeDisabled();
  });
});
