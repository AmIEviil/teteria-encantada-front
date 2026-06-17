import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomCalendarContainer } from "./CustomCalendarContainer";

describe("CustomCalendarContainer", () => {
  it("envuelve y renderiza sus hijos", () => {
    render(
      <CustomCalendarContainer>
        <span>contenido-calendario</span>
      </CustomCalendarContainer>,
    );
    expect(screen.getByText("contenido-calendario")).toBeInTheDocument();
  });
});
