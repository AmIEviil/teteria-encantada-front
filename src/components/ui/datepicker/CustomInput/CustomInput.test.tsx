import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "es" } }),
}));

import { CustomInput } from "./CustomInput";

describe("CustomInput", () => {
  it("muestra placeholder y dispara onClick", () => {
    const onClick = vi.fn();
    render(<CustomInput value="" onClick={onClick} />);

    const button = screen.getByText("modules.common.select_date");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});
