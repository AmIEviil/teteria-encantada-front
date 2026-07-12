import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const socketMock = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socketMock),
}));

import { getSocket } from "./socket";
import { useRealtimeReservations } from "./useRealtimeReservations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSocket", () => {
  it("retorna singleton", () => {
    const a = getSocket();
    const b = getSocket();
    expect(a).toBe(b);
  });
});

describe("useRealtimeReservations", () => {
  it("registra y limpia el listener", () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { unmount } = renderHook(() => useRealtimeReservations(), { wrapper });
    expect(socketMock.on).toHaveBeenCalledWith(
      "reservations:changed",
      expect.any(Function),
    );

    // dispara el handler para cubrir la invalidacion
    const handler = socketMock.on.mock.calls[0][1] as () => void;
    const spy = vi.spyOn(qc, "invalidateQueries");
    handler();
    expect(spy).toHaveBeenCalled();

    unmount();
    expect(socketMock.off).toHaveBeenCalled();
  });
});
