import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GaugeChart from "./GaugeChart";

describe("GaugeChart", () => {
  it("renderiza titulo y valores y consume GaugePointer", () => {
    const { container } = render(
      <GaugeChart title="Stock" minValue={0} maxValue={100} actualValue={40} />,
    );
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    // GaugePointer dibuja la aguja (path) dentro del gauge.
    expect(container.querySelector("path")).toBeTruthy();
  });
});
