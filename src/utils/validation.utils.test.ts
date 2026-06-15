import { describe, it, expect } from "vitest";
import {
  validateEmail,
  sanitizeRut,
  formatRut,
  validateRut,
  formatCellphone,
  validateCellphone,
  validatePassword,
} from "./validation.utils";

describe("validateEmail", () => {
  it("vacio", () => {
    expect(validateEmail("  ")).toBe("El correo es obligatorio");
  });
  it("invalido", () => {
    expect(validateEmail("no-mail")).toBe("Ingresa un correo válido");
  });
  it("valido", () => {
    expect(validateEmail("a@b.com")).toBe("");
  });
});

describe("sanitizeRut", () => {
  it("limpia y mayusculiza", () => {
    expect(sanitizeRut("12.345.678-k")).toBe("12345678K");
  });
  it("null", () => {
    expect(sanitizeRut(null)).toBe("");
  });
});

describe("formatRut", () => {
  it("formatea con puntos y guion", () => {
    expect(formatRut("12345678K")).toBe("12.345.678-K");
  });
  it("un solo caracter", () => {
    expect(formatRut("1")).toBe("1");
  });
  it("solo verificador", () => {
    expect(formatRut("KK")).toBe("K");
  });
});

describe("validateRut", () => {
  it("muy corto", () => {
    expect(validateRut("1")).toBe("El RUT es obligatorio");
  });
  it("cuerpo no numerico", () => {
    expect(validateRut("AB.CDE-1")).not.toBe("");
  });
  it("valido", () => {
    expect(validateRut("12.345.678-5")).toBe("");
  });
});

describe("formatCellphone", () => {
  it("vacio", () => {
    expect(formatCellphone("")).toBe("+56 9");
  });
  it("corto", () => {
    expect(formatCellphone("123")).toBe("+56 9 123");
  });
  it("completo quitando 569", () => {
    expect(formatCellphone("56912345678")).toBe("+56 9 1234 5678");
  });
});

describe("validateCellphone", () => {
  it("invalido", () => {
    expect(validateCellphone("123")).not.toBe("");
  });
  it("valido", () => {
    expect(validateCellphone("+56 9 1234 5678")).toBe("");
  });
});

describe("validatePassword", () => {
  it("vacio", () => {
    expect(validatePassword("")).toBe("La contraseña es obligatoria");
  });
  it("corta", () => {
    expect(validatePassword("Ab1")).toContain("8 caracteres");
  });
  it("sin complejidad", () => {
    expect(validatePassword("abcdefgh")).toContain("mayúscula");
  });
  it("valida", () => {
    expect(validatePassword("Secret123")).toBe("");
  });
});
