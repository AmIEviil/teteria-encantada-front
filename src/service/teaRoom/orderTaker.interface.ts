import type { Order } from "../../core/api/types";

export type OrderOrigin = "DIRECT" | "RESERVATION";

export interface OrderItemDraft {
  key: string;
  productId: string;
  quantity: number;
  notes: string;
}

export interface OrderTakerProps {
  selectedTableId?: string;
  onTableSelected?: (tableId: string) => void;
  isModal?: boolean;
}

export interface NumericStepperProps {
  label: string;
  value: number;
  min?: number;
  maxWidth?: number;
  onChange: (value: number) => void;
}

export interface OrderHistorySectionProps {
  isNoTableSelected: boolean;
  isTableSelected: boolean;
  loadingOrders: boolean;
  isSubmitting: boolean;
  visibleOrders: Order[];
  nowMs: number;
  formatCurrency: (amount: number) => string;
  onMarkOrderAsPaid: (orderId: string) => void;
}
