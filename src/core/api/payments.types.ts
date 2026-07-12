import type { PublicPurchaseItem, PublicPurchaseResult } from "./publicEvents.types";

export interface PayEventPayload {
  buyerEmail: string;
  items: PublicPurchaseItem[];
  payment: {
    token: string;
    installments: number;
    paymentMethodId: string;
    issuerId?: string;
  };
}

export interface PayEventResult {
  status: "approved" | "pending" | "rejected";
  statusDetail: string;
  purchase: PublicPurchaseResult | null;
}
