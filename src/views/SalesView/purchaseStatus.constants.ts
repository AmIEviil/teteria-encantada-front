import type { EventPurchaseStatus } from "../../core/api/types";

export const PURCHASE_STATUS_LABEL: Record<EventPurchaseStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  REJECTED: "Rechazada",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};
