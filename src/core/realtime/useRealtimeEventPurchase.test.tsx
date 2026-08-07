import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const handlers = new Map<string, (payload: unknown) => void>();
const on = vi.fn((evt: string, cb: (payload: unknown) => void) => {
  handlers.set(evt, cb);
});
const off = vi.fn((evt: string) => {
  handlers.delete(evt);
});

vi.mock("./socket", () => ({
  getSocket: () => ({ on, off }),
}));

import { useRealtimeEventPurchase } from "./useRealtimeEventPurchase";

describe("useRealtimeEventPurchase", () => {
  beforeEach(() => {
    handlers.clear();
    on.mockClear();
    off.mockClear();
  });

  it("no se suscribe sin purchaseId", () => {
    renderHook(() => useRealtimeEventPurchase(null, vi.fn()));
    expect(on).not.toHaveBeenCalled();
  });

  it("llama al callback sólo para su propia compra", () => {
    const onChange = vi.fn();
    renderHook(() => useRealtimeEventPurchase("p1", onChange));

    const emit = handlers.get("eventPurchase:changed")!;
    emit({ purchaseId: "otra", eventId: "e1", status: "PAID" });
    expect(onChange).not.toHaveBeenCalled();

    emit({ purchaseId: "p1", eventId: "e1", status: "PAID" });
    expect(onChange).toHaveBeenCalledWith({
      purchaseId: "p1",
      eventId: "e1",
      status: "PAID",
    });
  });

  it("no vuelve a suscribirse cuando cambia sólo el callback", () => {
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useRealtimeEventPurchase("p1", cb),
      { initialProps: { cb: vi.fn() } },
    );
    expect(on).toHaveBeenCalledTimes(1);

    rerender({ cb: vi.fn() });
    expect(on).toHaveBeenCalledTimes(1);
  });

  it("se desuscribe al desmontar", () => {
    const { unmount } = renderHook(() =>
      useRealtimeEventPurchase("p1", vi.fn()),
    );
    unmount();
    expect(off).toHaveBeenCalledWith(
      "eventPurchase:changed",
      expect.any(Function),
    );
  });
});
