import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GaugeContainer } from "@mui/x-charts/Gauge";
import { GaugePointer } from "./GaugePointer";

describe("GaugePointer", () => {
  it("dibuja el puntero dentro de un GaugeContainer", () => {
    const { container } = render(
      <GaugeContainer width={100} height={100} value={50}>
        <GaugePointer />
      </GaugeContainer>,
    );
    // El puntero renderiza un path (la aguja) cuando hay valueAngle.
    expect(container.querySelector("path")).toBeTruthy();
  });
});
