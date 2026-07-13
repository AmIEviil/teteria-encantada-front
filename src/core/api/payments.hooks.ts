import { useMutation } from "@tanstack/react-query";
import { paymentsService } from "./payments.service";
import type { PayEventPayload } from "./payments.types";

export const usePayEventMutation = (eventId: string) => {
  return useMutation({
    mutationFn: (payload: PayEventPayload) => paymentsService.payEvent(eventId, payload),
  });
};
