import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicEventDetailView } from "./PublicEventDetailView";

vi.mock("../../../core/api/public.hooks", () => ({
  usePublicEventDetailQuery: () => ({
    isLoading: false,
    data: {
      id: "e1", title: "Cata de Té", description: "Rica", startsAt: "2026-08-01T10:00:00Z",
      endsAt: "2026-08-01T12:00:00Z", officialImageUrl: null, isFreeEntry: false,
      hasSessions: true,
      ticketTypes: [{ id: "t1", name: "General", description: null, price: 5000, includesDetails: null, menuMode: "FIXED", menuTemplate: null, available: true, remaining: 10 }],
      sessions: [
        { id: "s1", date: "2026-08-01", startTime: "10:00", endTime: "11:00", name: "Mañana", available: true, remaining: 5, ticketTypes: [{ ticketTypeId: "t1", available: true, remaining: 5 }] },
        { id: "s2", date: "2026-08-02", startTime: "15:00", endTime: null, name: null, available: false, remaining: 0, ticketTypes: [] },
      ],
    },
  }),
}));

describe("PublicEventDetailView", () => {
  it("renders the event and jornada cards with availability", () => {
    render(
      <MemoryRouter initialEntries={["/publico/eventos/e1"]}>
        <PublicEventDetailView />
      </MemoryRouter>,
    );
    expect(screen.getByText("Cata de Té")).toBeInTheDocument();
    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.getByText("RESERVAR")).toBeInTheDocument();
    expect(screen.getByText("NO DISPONIBLE")).toBeInTheDocument();
  });

  it("con ?fecha solo muestra las jornadas de ese día", () => {
    render(
      <MemoryRouter initialEntries={["/publico/eventos/e1?fecha=2026-08-01"]}>
        <PublicEventDetailView />
      </MemoryRouter>,
    );
    expect(screen.getByText("Mañana")).toBeInTheDocument();
    expect(screen.queryByText("NO DISPONIBLE")).not.toBeInTheDocument(); // s2 es del 02
    expect(screen.getByText("Ver todas las jornadas")).toBeInTheDocument();
  });

  it("avisa cuando el día seleccionado no tiene jornadas", () => {
    render(
      <MemoryRouter initialEntries={["/publico/eventos/e1?fecha=2026-08-09"]}>
        <PublicEventDetailView />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Este evento no tiene jornadas para ese día."),
    ).toBeInTheDocument();
  });
});
