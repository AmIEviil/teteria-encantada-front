import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// vi.hoisted: vi.mock se eleva por encima del resto del archivo, así que el
// doble debe crearse dentro de él (mismo patrón que payments.service.test.ts).
const { getQrCheckout } = vi.hoisted(() => ({ getQrCheckout: vi.fn() }));

vi.mock("./payments.service", () => ({
  paymentsService: { getQrCheckout },
}));

import {
  qrCheckoutStatusRefetchInterval,
  useQrCheckoutStatusQuery,
} from "./payments.hooks";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("qrCheckoutStatusRefetchInterval", () => {
  it("sigue el polling cada 15s mientras el estado es PENDING", () => {
    const query = { state: { data: { status: "PENDING" } } } as never;
    expect(qrCheckoutStatusRefetchInterval(query)).toBe(15000);
  });

  it("detiene el polling apenas el estado deja de ser PENDING", () => {
    const query = { state: { data: { status: "PAID" } } } as never;
    expect(qrCheckoutStatusRefetchInterval(query)).toBe(false);
  });

  it("no hay polling sin datos todavía", () => {
    const query = { state: { data: undefined } } as never;
    expect(qrCheckoutStatusRefetchInterval(query)).toBe(false);
  });
});

describe("useQrCheckoutStatusQuery", () => {
  beforeEach(() => {
    getQrCheckout.mockReset();
  });

  it("consulta el estado del cobro vía paymentsService.getQrCheckout", async () => {
    getQrCheckout.mockResolvedValue({
      purchaseId: "p1",
      status: "PENDING",
      total: 1000,
      checkoutUrl: "https://mp.test/c/1",
      expiresAt: "2026-08-06T21:15:00.000Z",
    });

    const { result } = renderHook(() => useQrCheckoutStatusQuery("e1", "p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(getQrCheckout).toHaveBeenCalledWith("e1", "p1");
    expect(result.current.data?.status).toBe("PENDING");
  });

  it("no consulta si falta el purchaseId", () => {
    renderHook(() => useQrCheckoutStatusQuery("e1", ""), {
      wrapper: createWrapper(),
    });

    expect(getQrCheckout).not.toHaveBeenCalled();
  });
});
