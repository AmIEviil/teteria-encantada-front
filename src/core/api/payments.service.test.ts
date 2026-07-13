import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";
import { paymentsService } from "./payments.service";
import apiClient from "../client/client";

vi.mock("../client/client", () => ({ default: { post: vi.fn() } }));

describe("paymentsService.payEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hace POST al endpoint de pago", async () => {
    (apiClient.post as unknown as Mock).mockResolvedValue({
      data: { status: "approved", statusDetail: "ok", purchase: { tickets: [] } },
    });
    const res = await paymentsService.payEvent("e1", {
      buyerEmail: "a@b.cl", items: [],
      payment: { token: "t", installments: 1, paymentMethodId: "visa" },
    });
    expect(apiClient.post).toHaveBeenCalledWith("/public/events/e1/pay", expect.any(Object));
    expect(res.status).toBe("approved");
  });
});
