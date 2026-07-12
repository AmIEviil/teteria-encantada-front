import { describe, it, expect } from "vitest";
import {
  formatMoneyNumber,
  toUpperCaseFirstLetter,
  toPascalCaseMonth,
  formatName,
  getAbbreviation,
} from "./formatText.utils";

describe("formatMoneyNumber", () => {
  it("vacio cuando undefined o 0", () => {
    expect(formatMoneyNumber(undefined)).toBe("");
    expect(formatMoneyNumber(0)).toBe("");
  });
  it("formatea CLP", () => {
    expect(formatMoneyNumber(1000)).toContain("1.000");
  });
});

describe("toUpperCaseFirstLetter", () => {
  it("vacio", () => {
    expect(toUpperCaseFirstLetter("")).toBe("");
  });
  it("normaliza underscores y capitaliza", () => {
    expect(toUpperCaseFirstLetter("HOLA_MUNDO")).toBe("Hola mundo");
  });
});

describe("toPascalCaseMonth", () => {
  it("capitaliza primera letra", () => {
    expect(toPascalCaseMonth("enero")).toBe("Enero");
  });
});

describe("formatName", () => {
  it("vacio", () => {
    expect(formatName("")).toBe("");
  });
  it("reemplaza espacios por underscore", () => {
    expect(formatName("Juan Perez")).toBe("Juan_Perez");
  });
});

describe("getAbbreviation", () => {
  it("vacio", () => {
    expect(getAbbreviation("")).toBe("");
  });
  it("inicia cada palabra", () => {
    expect(getAbbreviation("Juan Perez")).toBe("JP");
  });
});
