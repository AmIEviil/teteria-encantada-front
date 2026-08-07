import apiClient from "../client/client";
import type {
  EventPurchaseStatus,
  PayEventPayload,
  PayEventResult,
  QrCheckout,
  QrCheckoutPayload,
  QrCheckoutStatus,
} from "./payments.types";

export const paymentsService = {
  payEvent: async (eventId: string, payload: PayEventPayload): Promise<PayEventResult> => {
    const response = await apiClient.post<PayEventResult>(
      `/public/events/${eventId}/pay`,
      payload,
    );
    return response.data;
  },

  createQrCheckout: async (
    eventId: string,
    payload: QrCheckoutPayload,
  ): Promise<QrCheckout> => {
    const response = await apiClient.post<QrCheckout>(
      `/events/${eventId}/qr-checkout`,
      payload,
    );
    return response.data;
  },

  getQrCheckout: async (
    eventId: string,
    purchaseId: string,
  ): Promise<QrCheckoutStatus> => {
    const response = await apiClient.get<QrCheckoutStatus>(
      `/events/${eventId}/qr-checkout/${purchaseId}`,
    );
    return response.data;
  },

  cancelQrCheckout: async (
    eventId: string,
    purchaseId: string,
  ): Promise<{ status: EventPurchaseStatus }> => {
    const response = await apiClient.post<{ status: EventPurchaseStatus }>(
      `/events/${eventId}/qr-checkout/${purchaseId}/cancel`,
    );
    return response.data;
  },
};
