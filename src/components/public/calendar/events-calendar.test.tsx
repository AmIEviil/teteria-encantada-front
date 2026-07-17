import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { PublicEvent } from "../../../core/api/types";
import { EventsCalendar } from "./EventsCalendar";
import { buildMonthEventMap } from "./events-calendar.utils";

const event = (id: string, title: string, startsAt: string, endsAt: string): PublicEvent => ({
  id,
  title,
  description: null,
  startsAt,
  endsAt,
  officialImageUrl: null,
  schedules: [],
  ticketsAvailable: true,
});

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("../../../core/api/public.hooks", () => ({
  usePublicEventsQuery: () => ({
    isLoading: false,
    data: [event("e1", "Taller de Té", "2026-07-01T10:00:00", "2026-07-03T20:00:00")],
  }),
}));

describe("buildMonthEventMap", () => {
  it("marca todos los días de un evento multi-día", () => {
    const map = buildMonthEventMap(
      [event("e1", "Taller", "2026-07-01T10:00:00", "2026-07-05T20:00:00")],
      2026,
      6,
    );

    expect([...map.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(map.get(3)?.[0].id).toBe("e1");
  });

  it("recorta un evento que cruza el borde del mes", () => {
    const map = buildMonthEventMap(
      [event("e1", "Cruza", "2026-06-28T10:00:00", "2026-07-02T20:00:00")],
      2026,
      6,
    );

    expect([...map.keys()].sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it("ignora eventos fuera del mes", () => {
    const map = buildMonthEventMap(
      [event("e1", "Agosto", "2026-08-01T10:00:00", "2026-08-02T20:00:00")],
      2026,
      6,
    );

    expect(map.size).toBe(0);
  });
});

describe("EventsCalendar", () => {
  it("navega al detalle al hacer click en una mini-card", async () => {
    vi.setSystemTime(new Date(2026, 6, 15));
    render(
      <MemoryRouter>
        <EventsCalendar />
      </MemoryRouter>,
    );

    const cards = screen.getAllByRole("button", { name: "Taller de Té" });
    expect(cards).toHaveLength(3); // 1, 2 y 3 de julio

    await userEvent.click(cards[0]);
    expect(navigate).toHaveBeenCalledWith("/publico/eventos/e1?fecha=2026-07-01");

    await userEvent.click(cards[2]);
    expect(navigate).toHaveBeenCalledWith("/publico/eventos/e1?fecha=2026-07-03");
  });
});
