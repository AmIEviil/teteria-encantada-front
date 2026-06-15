import { describe, it, expect, vi, afterEach } from "vitest";
import { setNavigator, navigateTo } from "./Navigation.utils";

describe("Navigation.utils", () => {
  afterEach(() => {
    setNavigator(undefined as never);
  });

  it("usa la funcion registrada", () => {
    const nav = vi.fn();
    setNavigator(nav);
    navigateTo("/x");
    expect(nav).toHaveBeenCalledWith("/x");
  });

  it("usa window.location.assign sin navegador", () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { assign },
      writable: true,
    });
    setNavigator(undefined as never);
    navigateTo("/y");
    expect(assign).toHaveBeenCalledWith("/y");
  });
});
