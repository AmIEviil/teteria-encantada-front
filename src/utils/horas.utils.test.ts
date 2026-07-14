import { describe, expect, it } from "vitest";
import { clampHoras } from "./horas.utils";

describe("clampHoras", () => {
  it("redondea al medio más cercano", () => {
    expect(clampHoras(7.3)).toBe(7.5);
    expect(clampHoras(7.2)).toBe(7);
    expect(clampHoras(0.24)).toBe(0);
  });

  it("mantiene los múltiplos de 0.5", () => {
    expect(clampHoras(8)).toBe(8);
    expect(clampHoras(8.5)).toBe(8.5);
  });

  it("recorta a 0 y a 24", () => {
    expect(clampHoras(-3)).toBe(0);
    expect(clampHoras(30)).toBe(24);
  });

  it("devuelve 0 para valores no numéricos", () => {
    expect(clampHoras(Number.NaN)).toBe(0);
  });
});
