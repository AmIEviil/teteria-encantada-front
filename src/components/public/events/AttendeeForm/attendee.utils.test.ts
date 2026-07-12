import { describe, it, expect } from "vitest";
import {
  buildCartItem,
  checkAvailability,
  isAttendeeDraftValid,
  menuExtraForDraft,
  type AttendeeDraft,
} from "./attendee.utils";
import type { CartItem } from "../../../../store/purchaseStore";
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

const cartItem = (ticketTypeId: string): CartItem => ({
  id: `c-${Math.random()}`, ticketTypeId, ticketTypeName: "X",
  attendeeFirstName: "A", attendeeLastName: "B", unitPrice: 5000, menuExtraPrice: 0,
});

describe("checkAvailability", () => {
  it("passes when everything is unlimited", () => {
    const r = checkAvailability([cartItem("t1")], [draft(), draft()], {
      remainingByType: { t1: null }, seatsRemaining: null,
    });
    expect(r.ok).toBe(true);
  });

  it("blocks when aggregate seats exceeded", () => {
    const r = checkAvailability([cartItem("t1")], [draft(), draft()], {
      remainingByType: { t1: null }, seatsRemaining: 2,
    });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("2");
  });

  it("blocks when a per-type cap is exceeded", () => {
    const r = checkAvailability([], [draft(), draft()], {
      remainingByType: { t1: 1 }, seatsRemaining: null,
    });
    expect(r.ok).toBe(false);
  });

  it("counts cart + drafts together against the type cap", () => {
    const r = checkAvailability([cartItem("t1")], [draft()], {
      remainingByType: { t1: 2 }, seatsRemaining: null,
    });
    expect(r.ok).toBe(true);
    const over = checkAvailability([cartItem("t1"), cartItem("t1")], [draft()], {
      remainingByType: { t1: 2 }, seatsRemaining: null,
    });
    expect(over.ok).toBe(false);
  });
});
