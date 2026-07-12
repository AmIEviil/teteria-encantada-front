import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicEventSessionView } from "./PublicEventSessionView";
import { usePurchaseStore } from "../../../store/purchaseStore";
import type { PublicEventDetail } from "../../../core/api/publicEvents.types";

const event = {
  id: "e1", title: "Cata", description: null, startsAt: "2026-08-01T10:00:00Z",
  endsAt: "2026-08-01T12:00:00Z", officialImageUrl: null, isFreeEntry: false, hasSessions: true,
  ticketTypes: [{ id: "t1", name: "General", description: null, price: 5000, includesDetails: "Incluye té", menuMode: "FIXED", menuTemplate: null, available: true, remaining: 5 }],
  sessions: [{ id: "s1", date: "2026-08-01", startTime: "10:00", endTime: "11:00", name: "Mañana", available: true, remaining: 5, ticketTypes: [{ ticketTypeId: "t1", available: true, remaining: 5 }] }],
} as unknown as PublicEventDetail;

describe("PublicEventSessionView", () => {
  beforeEach(() => {
    usePurchaseStore.getState().reset();
    usePurchaseStore.getState().setContext(event, event.sessions[0]);
  });

  it("shows the jornada header and available ticket types", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/publico/eventos/e1/jornada/s1"]}>
          <Routes>
            <Route path="/publico/eventos/:id/jornada/:sessionId" element={<PublicEventSessionView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Cata")).toBeInTheDocument();
    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Reservar ahora")).toBeInTheDocument();
  });
});
