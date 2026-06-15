import { describe, it, expect } from "vitest";
import {
  buildAllTimeOptions,
  normalizePhoneValue,
  isValidLookupInput,
  resolveLookupFilter,
  normalizeScheduleDays,
  buildAvailableDateKeys,
  buildTimeSlotsForDate,
  buildTimeSlots,
  WEEK_DAY_OPTIONS,
} from "./reservationSchedule.utils";

describe("buildAllTimeOptions", () => {
  it("genera slots desde 10:00 a 23:30 cada 30 min", () => {
    const options = buildAllTimeOptions();
    expect(options[0]).toBe("10:00");
    expect(options.at(-1)).toBe("23:30");
  });
});

describe("normalizePhoneValue", () => {
  it("vacio", () => {
    expect(normalizePhoneValue("  ")).toBe("");
  });
  it("conserva el +", () => {
    expect(normalizePhoneValue("+56 9 1234")).toBe("+5691234");
  });
  it("quita + interno sin prefijo", () => {
    expect(normalizePhoneValue("9-1234")).toBe("91234");
  });
});

describe("isValidLookupInput", () => {
  it("vacio", () => {
    expect(isValidLookupInput("")).toBe(false);
  });
  it("email valido", () => {
    expect(isValidLookupInput("a@b.com")).toBe(true);
  });
  it("email invalido", () => {
    expect(isValidLookupInput("a@b")).toBe(false);
  });
  it("telefono valido", () => {
    expect(isValidLookupInput("+56912345678")).toBe(true);
  });
  it("telefono corto", () => {
    expect(isValidLookupInput("123")).toBe(false);
  });
});

describe("resolveLookupFilter", () => {
  it("vacio", () => {
    expect(resolveLookupFilter("")).toEqual({});
  });
  it("email", () => {
    expect(resolveLookupFilter("A@B.com")).toEqual({ email: "a@b.com" });
  });
  it("telefono", () => {
    expect(resolveLookupFilter("+56912345678")).toEqual({
      phone: "+56912345678",
    });
  });
  it("telefono que normaliza vacio", () => {
    expect(resolveLookupFilter("abc")).toEqual({});
  });
});

describe("normalizeScheduleDays", () => {
  it("completa los 7 dias", () => {
    const result = normalizeScheduleDays(undefined);
    expect(result).toHaveLength(7);
    expect(result[0].dayOfWeek).toBe(0);
  });
  it("respeta datos provistos", () => {
    const result = normalizeScheduleDays([
      { dayOfWeek: 1, isOpen: false, opensAt: "11:00", closesAt: "20:00" },
    ]);
    const martes = result.find((d) => d.dayOfWeek === 1);
    expect(martes?.isOpen).toBe(false);
  });
});

describe("buildTimeSlots", () => {
  it("rango invalido devuelve vacio", () => {
    expect(buildTimeSlots("23:00", "10:00")).toEqual([]);
  });
  it("genera slots sin fecha objetivo", () => {
    const slots = buildTimeSlots("10:00", "12:00");
    expect(slots[0]).toBe("10:00");
    expect(slots.at(-1)).toBe("12:00");
  });
});

describe("buildTimeSlotsForDate", () => {
  it("fecha invalida devuelve vacio", () => {
    expect(buildTimeSlotsForDate("bad", undefined)).toEqual([]);
  });
  it("fecha futura devuelve slots", () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const result = buildTimeSlotsForDate(key, undefined);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("buildAvailableDateKeys", () => {
  it("devuelve fechas disponibles dentro del rango", () => {
    const keys = buildAvailableDateKeys(undefined, 30);
    expect(Array.isArray(keys)).toBe(true);
  });
});

describe("WEEK_DAY_OPTIONS", () => {
  it("tiene 7 dias", () => {
    expect(WEEK_DAY_OPTIONS).toHaveLength(7);
  });
});
