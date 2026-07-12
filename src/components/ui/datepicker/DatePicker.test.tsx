import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { vi } from "vitest";
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

import Calendar from "./DatePicker";

describe("Calendar", () => {
  it("renderiza titulo y el input custom", () => {
    render(<Calendar mode="day" title="Fecha" />);
    expect(screen.getByText("Fecha")).toBeInTheDocument();
    // CustomInput (subcomponente) muestra el placeholder traducido.
    expect(screen.getByText("modules.common.select_date")).toBeInTheDocument();
  });
});
