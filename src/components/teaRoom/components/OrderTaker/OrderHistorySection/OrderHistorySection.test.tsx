import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("abre modal al pulsar Marcar Pagada y confirma con propina", () => {
    const onMarkOrderAsPaid = vi.fn();
    const order = {
      id: "abc12345-0000-0000-0000-000000000000",
      tableId: "t1",
      table: null,
      reservationId: null,
      reservation: null,
      status: "SERVED" as const,
      notes: null,
      peopleCount: 2,
      total: 10000,
      tipAmount: null,
      paymentMethod: null,
      items: [],
      closedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <OrderHistorySection
        {...baseProps}
        isTableSelected
        visibleOrders={[order]}
        onMarkOrderAsPaid={onMarkOrderAsPaid}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Marcar Pagada" }));
    expect(onMarkOrderAsPaid).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Con propina (10%)" }));
    fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pago" }));

    expect(onMarkOrderAsPaid).toHaveBeenCalledWith(order.id, {
      tipAmount: 1000,
      paymentMethod: "CASH",
    });
  });
});
