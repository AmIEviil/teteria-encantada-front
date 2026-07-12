import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumericStepper } from "./NumericStepper";

describe("NumericStepper", () => {
  it("incrementa y respeta el minimo", () => {
    const onChange = vi.fn();
    render(<NumericStepper label="Cantidad" value={1} onChange={onChange} />);

    expect(screen.getByText("Cantidad")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Aumentar cantidad"));
    expect(onChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByLabelText("Reducir cantidad"));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
