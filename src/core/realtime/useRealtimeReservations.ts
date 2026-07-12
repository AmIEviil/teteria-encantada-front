import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "./socket";

export interface ReservationsChangedPayload {
  tableId?: string | null;
  reason: "REMINDER_SENT" | "CONFIRMED" | "DECLINED" | "NO_RESPONSE";
}

export const useRealtimeReservations = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    // El payload (ReservationsChangedPayload) no se usa: ante cualquier
    // cambio, refrescamos tablas y reservas vía React Query.
    const handleChange = () => {
      void queryClient.invalidateQueries({ queryKey: ["tables"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    };

    socket.on("reservations:changed", handleChange);

    return () => {
      socket.off("reservations:changed", handleChange);
    };
  }, [queryClient]);
};
