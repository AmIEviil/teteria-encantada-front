import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const cancelMutate = vi.fn().mockResolvedValue({ status: "CANCELLED" });
let realtimeCallback: ((p: { status: string }) => void) | null = null;

vi.mock("../../../core/api/payments.hooks", () => ({
  useCancelQrCheckoutMutation: () => ({
    mutateAsync: cancelMutate,
    isPending: false,
  }),
}));
vi.mock("../../../core/realtime/useRealtimeEventPurchase", () => ({
  useRealtimeEventPurchase: (
    _purchaseId: string | null,
    onChange: (p: { status: string }) => void,
  ) => {
    realtimeCallback = onChange;
  },
}));
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <div data-testid="qr">{value}</div>
  ),
}));

import { QrCheckoutPanel } from "./QrCheckoutPanel";

const checkout = {
  purchaseId: "p1",
  checkoutUrl: "https://mp.test/c/1",
  total: 25000,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  status: "PENDING" as const,
};

describe("QrCheckoutPanel", () => {
  beforeEach(() => {
    cancelMutate.mockClear();
    realtimeCallback = null;
  });

  it("muestra el QR con la URL de pago", () => {
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={vi.fn()} />,
    );
    expect(screen.getByTestId("qr")).toHaveTextContent("https://mp.test/c/1");
  });

  it("muestra el link en texto como respaldo del QR", () => {
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={vi.fn()} />,
    );
    expect(screen.getByDisplayValue("https://mp.test/c/1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copiar/i })).toBeInTheDocument();
  });

  it("cancelar llama a la mutación y avisa al padre", async () => {
    const onSettled = vi.fn();
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={onSettled} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar cobro/i }));

    await waitFor(() => {
      expect(cancelMutate).toHaveBeenCalledWith({
        eventId: "e1",
        purchaseId: "p1",
      });
      expect(onSettled).toHaveBeenCalledWith("CANCELLED");
    });
  });

  it("un evento PAID por tiempo real avisa al padre", async () => {
    const onSettled = vi.fn();
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={onSettled} />,
    );

    realtimeCallback?.({ status: "PAID" });

    await waitFor(() => expect(onSettled).toHaveBeenCalledWith("PAID"));
  });

  it("no avisa dos veces si cancelar y el evento de pago llegan juntos", async () => {
    const onSettled = vi.fn();
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={onSettled} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar cobro/i }));
    realtimeCallback?.({ status: "PAID" });

    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it("si cancelar falla, no avisa al padre y no deja el rechazo sin manejar", async () => {
    cancelMutate.mockRejectedValueOnce(new Error("red caída"));
    const onSettled = vi.fn();
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={onSettled} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar cobro/i }));

    await waitFor(() => expect(cancelMutate).toHaveBeenCalled());
    expect(onSettled).not.toHaveBeenCalled();
  });
});
