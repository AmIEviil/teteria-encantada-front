import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Query } from "@tanstack/react-query";
import { paymentsService } from "./payments.service";
import type {
  PayEventPayload,
  QrCheckoutPayload,
  QrCheckoutStatus,
} from "./payments.types";
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

// Se expone aparte del hook para poder testear la regla de polling sin
// tener que simular un ciclo completo de fetch de React Query: basta con
// invocarla con un objeto `query` que tenga el `state.data` deseado.
export const qrCheckoutStatusRefetchInterval = (
  query: Pick<Query<QrCheckoutStatus>, "state">,
): number | false => {
  // Mientras el cobro sigue PENDING, el socket puede haberse caído justo en
  // el instante en que el backend aprobó el pago (o lo rechazó/expiró), y el
  // panel se quedaría congelado sin nadie que lo rescate. Por eso se sigue
  // preguntando cada 15s. Apenas el estado deja de ser PENDING, no hay nada
  // más que esperar y el polling se detiene.
  return query.state.data?.status === "PENDING" ? 15000 : false;
};

export const useQrCheckoutStatusQuery = (
  eventId: string,
  purchaseId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["qr-checkout-status", eventId, purchaseId],
    queryFn: () => paymentsService.getQrCheckout(eventId, purchaseId),
    enabled: enabled && Boolean(eventId) && Boolean(purchaseId),
    refetchInterval: qrCheckoutStatusRefetchInterval,
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
