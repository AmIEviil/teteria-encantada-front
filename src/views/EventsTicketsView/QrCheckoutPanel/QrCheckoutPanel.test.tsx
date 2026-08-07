import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const cancelMutate = vi.fn().mockResolvedValue({ status: "CANCELLED" });
let realtimeCallback: ((p: { status: string }) => void) | null = null;

// Estado mutable leído por el mock de useQrCheckoutStatusQuery en cada
// render: permite simular la respuesta del polling de respaldo (Arreglo 4)
// sin tener que reescribir vi.mock por test, ya que las factories quedan
// elevadas (mismo patrón que EventsTicketsView.test.tsx).
const qrCheckoutStatusState = vi.hoisted(() => ({
  data: undefined as { status: string } | undefined,
}));

vi.mock("../../../core/api/payments.hooks", () => ({
  useCancelQrCheckoutMutation: () => ({
    mutateAsync: cancelMutate,
    isPending: false,
  }),
  useQrCheckoutStatusQuery: () => ({ data: qrCheckoutStatusState.data }),
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
    qrCheckoutStatusState.data = undefined;
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

  it("si el socket falló pero el polling de respaldo ve que el pago ya no está pendiente, avisa al padre", async () => {
    qrCheckoutStatusState.data = { status: "PAID" };
    const onSettled = vi.fn();
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={onSettled} />,
    );

    await waitFor(() => expect(onSettled).toHaveBeenCalledWith("PAID"));
  });

  it("mientras el polling de respaldo sigue en PENDING, no avisa al padre", () => {
    qrCheckoutStatusState.data = { status: "PENDING" };
    const onSettled = vi.fn();
    render(
      <QrCheckoutPanel eventId="e1" checkout={checkout} onSettled={onSettled} />,
    );

    expect(onSettled).not.toHaveBeenCalled();
  });

  it("al llegar la cuenta regresiva a 00:00 se auto-liquida como EXPIRED", () => {
    vi.useFakeTimers();
    try {
      const onSettled = vi.fn();
      const almostExpiredCheckout = {
        ...checkout,
        expiresAt: new Date(Date.now() + 1000).toISOString(),
      };

      render(
        <QrCheckoutPanel
          eventId="e1"
          checkout={almostExpiredCheckout}
          onSettled={onSettled}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(onSettled).toHaveBeenCalledWith("EXPIRED");
    } finally {
      vi.useRealTimers();
    }
  });
});
