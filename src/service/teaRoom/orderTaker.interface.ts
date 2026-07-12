import type { Order, OrderPaymentMethod } from "../../core/api/types";

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
  onMarkOrderAsPaid: (orderId: string, payment: OrderPaymentSelection) => void;
}

export interface OrderPaymentSelection {
  tipAmount: number;
  paymentMethod: OrderPaymentMethod;
}

export interface MarkOrderPaidModalProps {
  order: Order | null;
  isSubmitting: boolean;
  formatCurrency: (amount: number) => string;
  onClose: () => void;
  onConfirm: (payment: OrderPaymentSelection) => void;
}
