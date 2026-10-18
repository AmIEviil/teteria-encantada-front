import { useEffect, useEffectEvent } from "react";
import { getSocket } from "./socket";

export interface EventPurchaseChangedPayload {
  purchaseId: string;
  eventId: string;
  status: "PAID" | "CANCELLED" | "EXPIRED" | "REJECTED";
}

// El gateway emite a todos los clientes conectados: el filtro por purchaseId
// se hace acá. onChange va por useEffectEvent para que un callback nuevo en
// cada render no provoque re-suscripciones al socket.
export const useRealtimeEventPurchase = (
  purchaseId: string | null,
  onChange: (payload: EventPurchaseChangedPayload) => void,
): void => {
  const onChangeEvent = useEffectEvent(onChange);

  useEffect(() => {
    if (!purchaseId) return;

    const socket = getSocket();
    const handler = (payload: EventPurchaseChangedPayload) => {
      if (payload.purchaseId !== purchaseId) return;
      onChangeEvent(payload);
    };

    socket.on("eventPurchase:changed", handler);

    return () => {
      socket.off("eventPurchase:changed", handler);
    };
  }, [purchaseId]);
};
