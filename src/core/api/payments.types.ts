import type { PublicPurchaseItem, PublicPurchaseResult } from "./publicEvents.types";
import type { CreateEventPurchaseItemPayload } from "./types";

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

export type EventPurchaseStatus =
  | "PENDING"
  | "PAID"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface QrCheckoutPayload {
  buyerEmail: string;
  items: CreateEventPurchaseItemPayload[];
}

export interface QrCheckout {
  purchaseId: string;
  // URL de Checkout Pro; es lo que se codifica en el QR.
  checkoutUrl: string;
  total: number;
  expiresAt: string;
  status: EventPurchaseStatus;
}

export interface QrCheckoutStatus {
  purchaseId: string;
  status: EventPurchaseStatus;
  total: number;
  checkoutUrl: string | null;
  expiresAt: string | null;
}
