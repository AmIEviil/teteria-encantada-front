import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

import { DatePickerFooter } from "./DatePickerFooter";

describe("DatePickerFooter", () => {
  it("dispara onClear y onToday", () => {
    const onClear = vi.fn();
    const onToday = vi.fn();
    render(<DatePickerFooter onClear={onClear} onToday={onToday} />);

    fireEvent.click(screen.getByText("modules.common.erase"));
    expect(onClear).toHaveBeenCalled();

    fireEvent.click(screen.getByText("modules.common.today"));
    expect(onToday).toHaveBeenCalled();
  });
});
