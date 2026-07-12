import { create } from "zustand";
import type { EventTicketMenuSelection } from "../core/api/types";
import type {
  PublicEventDetail,
  PublicEventDetailSession,
} from "../core/api/publicEvents.types";

export interface CartItem {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  menuSelection?: EventTicketMenuSelection;
  unitPrice: number;
  menuExtraPrice: number;
}

interface PurchaseState {
  eventId: string | null;
  event: PublicEventDetail | null;
  session: PublicEventDetailSession | null;
  items: CartItem[];
  buyerEmail: string;
  setContext: (
    event: PublicEventDetail,
    session: PublicEventDetailSession | null,
  ) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  setBuyerEmail: (email: string) => void;
  total: () => number;
  reset: () => void;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  eventId: null,
  event: null,
  session: null,
  items: [],
  buyerEmail: "",
  setContext: (event, session) =>
    set((state) => {
      const changedEvent = state.eventId !== event.id;
      return {
        eventId: event.id,
        event,
        session,
        items: changedEvent ? [] : state.items,
        buyerEmail: changedEvent ? "" : state.buyerEmail,
      };
    }),
  addItems: (items) => set((state) => ({ items: [...state.items, ...items] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  setBuyerEmail: (buyerEmail) => set({ buyerEmail }),
  total: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice + i.menuExtraPrice, 0),
  reset: () =>
    set({ eventId: null, event: null, session: null, items: [], buyerEmail: "" }),
}));
