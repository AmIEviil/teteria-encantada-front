import { describe, it, expect } from "vitest";
import {
  buildCartItem,
  isAttendeeDraftValid,
  menuExtraForDraft,
  type AttendeeDraft,
} from "./attendee.utils";
import type { PublicEventDetailTicketType } from "../../../../core/api/publicEvents.types";

const fixedType: PublicEventDetailTicketType = {
  id: "t1", name: "General", description: null, price: 5000,
  includesDetails: null, menuMode: "FIXED", menuTemplate: null,
  available: true, remaining: 10,
};

const customType: PublicEventDetailTicketType = {
  id: "t2", name: "Con menú", description: null, price: 8000,
  includesDetails: null, menuMode: "CUSTOMIZABLE",
  menuTemplate: {
    groups: [
      { key: "plato", label: "Plato", required: true, minSelect: 1, maxSelect: 1,
        options: [
          { id: "o1", label: "Torta", extraPrice: 1000, isActive: true },
          { id: "o2", label: "Kuchen", extraPrice: 2000, isActive: true },
        ] },
    ],
  },
  available: true, remaining: 10,
};

const draft = (over: Partial<AttendeeDraft> = {}): AttendeeDraft => ({
  id: "a1", firstName: "Ana", lastName: "P", ticketTypeId: "t1",
  menuByGroup: {}, ...over,
});

describe("attendee.utils", () => {
  it("validates a FIXED-type draft with names + ticket", () => {
    expect(isAttendeeDraftValid(draft(), fixedType)).toBe(true);
    expect(isAttendeeDraftValid(draft({ firstName: "" }), fixedType)).toBe(false);
  });

  it("requires a required menu group selection for CUSTOMIZABLE", () => {
    const d = draft({ ticketTypeId: "t2", menuByGroup: {} });
    expect(isAttendeeDraftValid(d, customType)).toBe(false);
    const ok = draft({ ticketTypeId: "t2", menuByGroup: { plato: ["o1"] } });
    expect(isAttendeeDraftValid(ok, customType)).toBe(true);
  });

  it("sums menu extras", () => {
    const d = draft({ ticketTypeId: "t2", menuByGroup: { plato: ["o2"] } });
    expect(menuExtraForDraft(d, customType)).toBe(2000);
    expect(menuExtraForDraft(draft(), fixedType)).toBe(0);
  });

  it("builds a cart item with base price + extras", () => {
    const d = draft({ ticketTypeId: "t2", menuByGroup: { plato: ["o1"] } });
    const item = buildCartItem(d, customType);
    expect(item.unitPrice).toBe(8000);
    expect(item.menuExtraPrice).toBe(1000);
    expect(item.ticketTypeName).toBe("Con menú");
    expect(item.menuSelection).toEqual({ groups: [{ groupKey: "plato", optionIds: ["o1"] }] });
  });
});
