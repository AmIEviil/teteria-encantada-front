import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted: vi.mock se eleva por encima del resto del archivo, así que los
// dobles deben crearse dentro de él. Es el patrón que ya usan los otros tests
// del repo (ver EventsTicketsView.test.tsx).
const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock("../client/client", () => ({
  default: { post, get },
}));

import { paymentsService } from "./payments.service";

describe("paymentsService — checkout QR", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it("createQrCheckout postea al endpoint del evento", async () => {
    post.mockResolvedValue({
      data: {
        purchaseId: "p1",
        checkoutUrl: "https://mp.test/c/1",
        total: 10000,
        expiresAt: "2026-08-06T21:15:00.000Z",
        status: "PENDING",
      },
    });

    const res = await paymentsService.createQrCheckout("e1", {
      buyerEmail: "b@t.cl",
      items: [],
    });

    expect(post).toHaveBeenCalledWith("/events/e1/qr-checkout", {
      buyerEmail: "b@t.cl",
      items: [],
    });
    expect(res.checkoutUrl).toBe("https://mp.test/c/1");
  });

  it("getQrCheckout consulta el estado de la compra", async () => {
    get.mockResolvedValue({ data: { purchaseId: "p1", status: "PAID" } });

    const res = await paymentsService.getQrCheckout("e1", "p1");

    expect(get).toHaveBeenCalledWith("/events/e1/qr-checkout/p1");
    expect(res.status).toBe("PAID");
  });

  it("cancelQrCheckout postea al endpoint de cancelación", async () => {
    post.mockResolvedValue({ data: { status: "CANCELLED" } });

    const res = await paymentsService.cancelQrCheckout("e1", "p1");

    expect(post).toHaveBeenCalledWith("/events/e1/qr-checkout/p1/cancel");
    expect(res.status).toBe("CANCELLED");
  });
});
