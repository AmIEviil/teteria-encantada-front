import { describe, expect, it } from "vitest";
import { findFreeCell, getTableFootprint } from "./useFloorPlanLogic";
import type { TableProps } from "../components/table/Table";

const grid = { rows: 5, cols: 8 };
const small = { cols: 1, rows: 1 };

const tableAt = (x: number, y: number): TableProps => ({ position: { x, y }, type: "small" });

describe("findFreeCell", () => {
  it("llena la columna (5 filas) antes de saltar a la siguiente", () => {
    // 5 mesas ocupando la columna 0 (filas 0..4) -> la 6a cae en columna 1, fila 0.
    const tables = Array.from({ length: 5 }, (_, row) => tableAt(0, row * 80));
    expect(findFreeCell({ tables, chairs: [], gridSize: grid, cellSize: 80, footprint: small }))
      .toEqual({ x: 80, y: 0 });
  });

  it("primera celda libre arranca en (0,0)", () => {
    expect(findFreeCell({ tables: [], chairs: [], gridSize: grid, cellSize: 80, footprint: small }))
      .toEqual({ x: 0, y: 0 });
  });

  it("una mesa grande horizontal ocupa 2 celdas, la siguiente las salta", () => {
    const big: TableProps = { position: { x: 0, y: 0 }, type: "large", isRotated: false };
    // ocupa (0,0) y (1,0); el small libre baja a (0,80).
    expect(findFreeCell({ tables: [big], chairs: [], gridSize: grid, cellSize: 80, footprint: small }))
      .toEqual({ x: 0, y: 80 });
  });

  it("footprint grande horizontal", () => {
    expect(getTableFootprint("large", false)).toEqual({ cols: 2, rows: 1 });
    expect(getTableFootprint("large", true)).toEqual({ cols: 1, rows: 2 });
    expect(getTableFootprint("small", false)).toEqual({ cols: 1, rows: 1 });
  });
});
