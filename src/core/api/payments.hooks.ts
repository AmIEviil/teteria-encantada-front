import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "./payments.service";
import type { PayEventPayload, QrCheckoutPayload } from "./payments.types";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";

export const usePayEventMutation = (eventId: string) => {
  return useMutation({
    mutationFn: (payload: PayEventPayload) => paymentsService.payEvent(eventId, payload),
  });
};

interface CreateQrCheckoutVariables {
  eventId: string;
  payload: QrCheckoutPayload;
}

export const useCreateQrCheckoutMutation = () => {
  return useMutation({
    mutationFn: ({ eventId, payload }: CreateQrCheckoutVariables) =>
      paymentsService.createQrCheckout(eventId, payload),
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo generar el QR de pago"), "error");
    },
  });
};

interface CancelQrCheckoutVariables {
  eventId: string;
  purchaseId: string;
}

export const useCancelQrCheckoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, purchaseId }: CancelQrCheckoutVariables) =>
      paymentsService.cancelQrCheckout(eventId, purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo cancelar el cobro"), "error");
    },
  });
};
