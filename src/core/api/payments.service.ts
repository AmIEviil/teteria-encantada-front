import apiClient from "../client/client";
import type { PayEventPayload, PayEventResult } from "./payments.types";

export const paymentsService = {
  payEvent: async (eventId: string, payload: PayEventPayload): Promise<PayEventResult> => {
    const response = await apiClient.post<PayEventResult>(
      `/public/events/${eventId}/pay`,
      payload,
    );
    return response.data;
  },
};
