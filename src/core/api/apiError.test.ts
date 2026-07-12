import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { getApiErrorMessage } from "./apiError";

describe("getApiErrorMessage", () => {
  it("array de mensajes", () => {
    const err = new AxiosError("x");
    err.response = { data: { message: ["a", "b"] } } as never;
    expect(getApiErrorMessage(err, "fb")).toBe("a. b");
  });

  it("mensaje string", () => {
    const err = new AxiosError("x");
    err.response = { data: { message: "boom" } } as never;
    expect(getApiErrorMessage(err, "fb")).toBe("boom");
  });

  it("error normal", () => {
    expect(getApiErrorMessage(new Error("plain"), "fb")).toBe("plain");
  });

  it("fallback", () => {
    expect(getApiErrorMessage({}, "fb")).toBe("fb");
  });
});
