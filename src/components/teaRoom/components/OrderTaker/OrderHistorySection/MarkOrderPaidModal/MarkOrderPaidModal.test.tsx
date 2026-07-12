import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarkOrderPaidModal } from "./MarkOrderPaidModal";
import type { Order } from "../../../../../../core/api/types";

const order: Order = {
  id: "abc12345-0000-0000-0000-000000000000",
  tableId: null,
  table: null,
  reservationId: null,
  reservation: null,
  status: "SERVED",
  notes: null,
  peopleCount: 2,
  total: 10000,
  tipAmount: null,
  paymentMethod: null,
  items: [],
  closedAt: null,
  createdAt: "2026-07-11T12:00:00.000Z",
  updatedAt: "2026-07-11T12:00:00.000Z",
};

const baseProps = {
  order,
  isSubmitting: false,
  formatCurrency: (amount: number) => `$${amount}`,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

describe("MarkOrderPaidModal", () => {
  it("muestra resumen con propina 10% y totales", () => {
    render(<MarkOrderPaidModal {...baseProps} />);
    expect(screen.getByText(/Propina \(10%\): \$1000/)).toBeInTheDocument();
    expect(screen.getByText(/Total con propina: \$11000/)).toBeInTheDocument();
    expect(screen.getByText(/Total sin propina: \$10000/)).toBeInTheDocument();
  });

  it("deshabilita confirmar hasta elegir propina y medio de pago", () => {
    render(<MarkOrderPaidModal {...baseProps} />);
    const confirmButton = screen.getByRole("button", { name: "Confirmar pago" });
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Con propina (10%)" }));
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
    expect(confirmButton).toBeEnabled();
  });

  it("confirma con propina y efectivo", () => {
    const onConfirm = vi.fn();
    render(<MarkOrderPaidModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Con propina (10%)" }));
    fireEvent.click(screen.getByRole("button", { name: "Efectivo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pago" }));
    expect(onConfirm).toHaveBeenCalledWith({ tipAmount: 1000, paymentMethod: "CASH" });
  });

  it("confirma sin propina y tarjeta", () => {
    const onConfirm = vi.fn();
    render(<MarkOrderPaidModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Sin propina" }));
    fireEvent.click(screen.getByRole("button", { name: "Tarjeta" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pago" }));
    expect(onConfirm).toHaveBeenCalledWith({ tipAmount: 0, paymentMethod: "CARD" });
  });

  it("no renderiza nada sin orden", () => {
    const { container } = render(
      <MarkOrderPaidModal {...baseProps} order={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
