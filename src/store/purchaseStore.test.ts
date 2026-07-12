import { describe, it, expect, beforeEach } from "vitest";
import { usePurchaseStore } from "./purchaseStore";
import type { PublicEventDetail } from "../core/api/publicEvents.types";

const event = { id: "e1", title: "Evento" } as unknown as PublicEventDetail;
const item = {
  id: "c1", ticketTypeId: "t1", ticketTypeName: "A",
  attendeeFirstName: "Ana", attendeeLastName: "P",
  unitPrice: 5000, menuExtraPrice: 1000,
};

describe("usePurchaseStore", () => {
  beforeEach(() => usePurchaseStore.getState().reset());

  it("adds items and totals unitPrice + menuExtraPrice", () => {
    usePurchaseStore.getState().addItems([item]);
    expect(usePurchaseStore.getState().items).toHaveLength(1);
    expect(usePurchaseStore.getState().total()).toBe(6000);
  });

  it("removes an item by id", () => {
    usePurchaseStore.getState().addItems([item]);
    usePurchaseStore.getState().removeItem("c1");
    expect(usePurchaseStore.getState().items).toHaveLength(0);
  });

  it("resets cart when the event context changes", () => {
    usePurchaseStore.getState().setContext(event, null);
    usePurchaseStore.getState().addItems([item]);
    const other = { id: "e2", title: "Otro" } as unknown as PublicEventDetail;
    usePurchaseStore.getState().setContext(other, null);
    expect(usePurchaseStore.getState().items).toHaveLength(0);
    expect(usePurchaseStore.getState().eventId).toBe("e2");
  });

  it("keeps cart when re-setting the same event context", () => {
    usePurchaseStore.getState().setContext(event, null);
    usePurchaseStore.getState().addItems([item]);
    usePurchaseStore.getState().setContext(event, null);
    expect(usePurchaseStore.getState().items).toHaveLength(1);
  });
});
