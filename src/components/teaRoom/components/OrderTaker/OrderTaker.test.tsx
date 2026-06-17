import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const query = vi.hoisted(() => ({
  tables: vi.fn(),
  products: vi.fn(),
  orders: vi.fn(),
  reservations: vi.fn(),
}));
const mutation = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
}));

vi.mock("../../../../core/api/tables.hooks", () => ({
  useTablesQuery: () => query.tables(),
}));
vi.mock("../../../../core/api/products.hooks", () => ({
  useProductsQuery: () => query.products(),
}));
vi.mock("../../../../core/api/orders.hooks", () => ({
  useOrdersQuery: () => query.orders(),
  useCreateOrderMutation: () => mutation,
  useUpdateOrderMutation: () => mutation,
}));
vi.mock("../../../../core/api/reservations.hooks", () => ({
  useReservationsQuery: () => query.reservations(),
}));

import { OrderTaker } from "./OrderTaker";

beforeEach(() => {
  vi.clearAllMocks();
  query.tables.mockReturnValue({ data: [], isLoading: false });
  query.products.mockReturnValue({
    data: [],
    isLoading: false,
    refetch: vi.fn().mockResolvedValue({ data: [] }),
  });
  query.orders.mockReturnValue({ data: [], isLoading: false });
  query.reservations.mockReturnValue({ data: [], isLoading: false });
});

describe("OrderTaker", () => {
  it("renderiza el formulario y consume los subcomponentes", () => {
    render(<OrderTaker />);

    expect(screen.getByText("Tomar Orden")).toBeInTheDocument();
    // NumericStepper (subcomponente)
    expect(screen.getByText("Cantidad de personas")).toBeInTheDocument();
    // OrderHistorySection (subcomponente), default consumo sin mesa
    expect(screen.getByText("Ordenes sin mesa")).toBeInTheDocument();
  });
});
