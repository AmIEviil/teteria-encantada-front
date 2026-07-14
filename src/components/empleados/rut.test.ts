import { describe, expect, it } from "vitest";
import { formatRut, isValidRut } from "./rut";

describe("rut", () => {
  it("formatea con guion y sin puntos", () => {
    expect(formatRut("202800074-2")).toBe("202800074-2");
    expect(formatRut("20.280.007-K")).toBe("20280007-K");
    expect(formatRut("202800074k")).toBe("202800074-K");
  });

  it("acepta hasta 9 digitos de cuerpo y verificador 0-9 o K", () => {
    expect(isValidRut("202800074-2")).toBe(true);
    expect(isValidRut("202800074-K")).toBe(true);
    expect(isValidRut("1-9")).toBe(true);
    expect(isValidRut("1234567890-1")).toBe(false);
    expect(isValidRut("K")).toBe(false);
    expect(isValidRut("")).toBe(false);
  });
});
