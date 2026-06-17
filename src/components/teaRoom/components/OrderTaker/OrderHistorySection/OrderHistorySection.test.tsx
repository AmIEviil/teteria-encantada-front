import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderHistorySection } from "./OrderHistorySection";

const baseProps = {
  isNoTableSelected: false,
  isTableSelected: false,
  loadingOrders: false,
  isSubmitting: false,
  visibleOrders: [],
  nowMs: Date.now(),
  formatCurrency: (amount: number) => `$${amount}`,
  onMarkOrderAsPaid: vi.fn(),
};

describe("OrderHistorySection", () => {
  it("pide seleccionar mesa cuando no hay mesa elegida", () => {
    render(<OrderHistorySection {...baseProps} />);
    expect(
      screen.getByText("Selecciona una mesa para ver sus ordenes"),
    ).toBeInTheDocument();
  });

  it("muestra vacio para consumo sin mesa", () => {
    render(<OrderHistorySection {...baseProps} isNoTableSelected />);
    expect(screen.getByText("No hay ordenes sin mesa")).toBeInTheDocument();
  });
});
