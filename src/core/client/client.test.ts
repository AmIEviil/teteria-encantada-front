import { describe, it, expect, beforeEach, vi } from "vitest";
import apiClient from "./client";

interface Handler {
  fulfilled: (value: unknown) => unknown;
  rejected: (error: unknown) => unknown;
}

const reqHandler = (
  apiClient as unknown as {
    interceptors: { request: { handlers: Handler[] } };
  }
).interceptors.request.handlers[0];

const resHandler = (
  apiClient as unknown as {
    interceptors: { response: { handlers: Handler[] } };
  }
).interceptors.response.handlers[0];

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "location", {
    value: { assign: vi.fn() },
    writable: true,
  });
});

describe("request interceptor", () => {
  it("agrega Authorization si hay token", () => {
    localStorage.setItem("token", "tok");
    const config = reqHandler.fulfilled({ headers: {} }) as {
      headers: { Authorization?: string };
    };
    expect(config.headers.Authorization).toBe("Bearer tok");
  });

  it("sin token no agrega header", () => {
    const config = reqHandler.fulfilled({ headers: {} }) as {
      headers: { Authorization?: string };
    };
    expect(config.headers.Authorization).toBeUndefined();
  });

  it("rejected propaga el error", async () => {
    await expect(reqHandler.rejected(new Error("x"))).rejects.toThrow("x");
  });
});

describe("response interceptor", () => {
  it("fulfilled devuelve la respuesta", () => {
    const resp = { data: 1 };
    expect(resHandler.fulfilled(resp)).toBe(resp);
  });

  it("401 limpia sesion y redirige", async () => {
    localStorage.setItem("token", "tok");
    await expect(
      resHandler.rejected({ response: { status: 401 } }),
    ).rejects.toBeDefined();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("otros errores se propagan sin limpiar", async () => {
    localStorage.setItem("token", "tok");
    await expect(
      resHandler.rejected({ response: { status: 500 } }),
    ).rejects.toBeDefined();
    expect(localStorage.getItem("token")).toBe("tok");
  });
});
