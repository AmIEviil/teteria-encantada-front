import { describe, expect, it } from "vitest";
import { dateToKey, formatCurrency, formatDateTime } from "./sales.utils";

describe("sales.utils", () => {
  it("formatCurrency formatea CLP sin decimales", () => {
    expect(formatCurrency(1500).replace(/\s/g, "")).toBe("$1.500");
  });

  it("formatCurrency trata NaN/0 como cero", () => {
    expect(formatCurrency(0).replace(/\s/g, "")).toBe("$0");
    expect(formatCurrency(Number.NaN).replace(/\s/g, "")).toBe("$0");
  });

  it("formatDateTime devuelve guion largo si la fecha es invalida", () => {
    expect(formatDateTime("no-es-fecha")).toBe("—");
  });

  it("formatDateTime formatea una fecha valida", () => {
    expect(formatDateTime("2026-10-17T15:00:00Z")).not.toBe("—");
  });

  it("dateToKey usa los componentes locales de la fecha", () => {
    expect(dateToKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
