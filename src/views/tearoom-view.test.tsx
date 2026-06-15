import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const reservationsQuery = vi.hoisted(() => ({ fn: vi.fn() }));
const updateMutation = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
}));

vi.mock("../core/api/reservations.hooks", () => ({
  useReservationsQuery: () => reservationsQuery.fn(),
  useUpdateReservationMutation: () => updateMutation,
}));
vi.mock("../components/teaRoom/FloorPlan/FloorPlan", () => ({
  FloorPlan: ({ onSelectTable }: { onSelectTable: (id: string) => void }) => (
    <button onClick={() => onSelectTable("mesa-1")}>floorplan-select</button>
  ),
}));
vi.mock("../components/teaRoom/components/OrderTaker/OrderTaker", () => ({
  OrderTaker: () => <div>order-taker</div>,
}));

import { TeaRoomView } from "./TeaRoomView";

beforeEach(() => {
  vi.clearAllMocks();
  reservationsQuery.fn.mockReturnValue({
    data: [],
    refetch: vi.fn().mockResolvedValue({}),
  });
});

describe("TeaRoomView", () => {
  it("renderiza vista dividida y togglea modo", () => {
    render(<TeaRoomView />);
    expect(screen.getByText("order-taker")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pantalla grande"));
    expect(screen.getByText("Vista dividida")).toBeInTheDocument();
    fireEvent.click(screen.getByText("floorplan-select"));
  });

  it("muestra dialog de reserva vencida y permite extender", async () => {
    reservationsQuery.fn.mockReturnValue({
      data: [
        {
          id: "r1",
          reservedFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          waitingUntil: null,
          holderName: "Ana",
          table: { label: "MESA_3", code: "M3" },
        },
      ],
      refetch: vi.fn().mockResolvedValue({}),
    });
    render(<TeaRoomView />);
    await waitFor(() =>
      expect(screen.getByText("Reserva vencida")).toBeInTheDocument(),
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Esperar 15 min mas"));
    });
    expect(updateMutation.mutateAsync).toHaveBeenCalled();
  });

  it("permite cancelar reserva vencida", async () => {
    reservationsQuery.fn.mockReturnValue({
      data: [
        {
          id: "r2",
          reservedFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          waitingUntil: null,
          holderName: null,
          table: null,
        },
      ],
      refetch: vi.fn().mockResolvedValue({}),
    });
    render(<TeaRoomView />);
    await waitFor(() =>
      expect(screen.getByText("Reserva vencida")).toBeInTheDocument(),
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Aceptar y cancelar"));
    });
    expect(updateMutation.mutateAsync).toHaveBeenCalled();
  });
});
