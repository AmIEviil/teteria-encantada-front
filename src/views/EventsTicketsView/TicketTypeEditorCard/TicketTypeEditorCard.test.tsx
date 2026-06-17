import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketTypeEditorCard } from "./TicketTypeEditorCard";
import type { TicketTypeDraft } from "../../../service/events/events.interface";

const ticketType: TicketTypeDraft = {
  id: "t1",
  name: "General",
  description: "",
  price: "1000",
  includesDetails: "",
  menuMode: "FIXED",
  menuTemplate: { groups: [] },
  totalStock: "",
  isPromotional: false,
  promoMinQuantity: "",
  promoBundlePrice: "",
  dailyStocks: [],
};

const handlers = {
  onRemoveTicketType: vi.fn(),
  onTicketTypeFieldChange: vi.fn(),
  onAddDailyStock: vi.fn(),
  onRemoveDailyStock: vi.fn(),
  onDailyStockFieldChange: vi.fn(),
  onAddMenuGroup: vi.fn(),
  onRemoveMenuGroup: vi.fn(),
  onMenuGroupFieldChange: vi.fn(),
  onAddMenuOption: vi.fn(),
  onRemoveMenuOption: vi.fn(),
  onMenuOptionFieldChange: vi.fn(),
};

describe("TicketTypeEditorCard", () => {
  it("renderiza el tipo y dispara la eliminacion", () => {
    const onRemoveTicketType = vi.fn();
    render(
      <TicketTypeEditorCard
        {...handlers}
        onRemoveTicketType={onRemoveTicketType}
        ticketType={ticketType}
        index={0}
      />,
    );

    expect(screen.getByText("Tipo 1")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Eliminar tipo 1"));
    expect(onRemoveTicketType).toHaveBeenCalledWith("t1");
  });
});
