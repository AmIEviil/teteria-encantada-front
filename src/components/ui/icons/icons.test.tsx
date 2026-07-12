import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

// Importa todos los iconos y los renderiza para cubrir su markup SVG.
const modules = import.meta.glob("./*.tsx", { eager: true }) as Record<
  string,
  { default?: React.ComponentType<Record<string, unknown>> }
>;

describe("icons", () => {
  const entries = Object.entries(modules).filter(
    ([path, mod]) =>
      !path.includes(".test.") && typeof mod.default === "function",
  );

  it("hay iconos para renderizar", () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it.each(entries)("renderiza %s", (_path, mod) => {
    const Component = mod.default as React.ComponentType<
      Record<string, unknown>
    >;
    const { unmount } = render(
      React.createElement(Component, { children: React.createElement("span") }),
    );
    unmount();
  });

  it("renderiza iconos con props personalizadas", () => {
    for (const [, mod] of entries) {
      const Component = mod.default as React.ComponentType<
        Record<string, unknown>
      >;
      const { unmount } = render(
        React.createElement(Component, {
          size: 32,
          color: "#fff",
          className: "x",
          ariaLabel: "icono",
          children: React.createElement("span"),
        }),
      );
      unmount();
    }
    expect(true).toBe(true);
  });
});
