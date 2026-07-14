import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { horasService } from "./horas.service";
import type { UpsertRegistroHoraPayload } from "./types";

export const HORAS_QUERY_KEY = ["horas"] as const;

export const useRegistroHorasQuery = (
  mes: string,
  trabajadorId?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [...HORAS_QUERY_KEY, trabajadorId ?? "me", mes],
    queryFn: () => horasService.findMonth({ trabajadorId, mes }),
    enabled,
  });
};

export const useUpsertRegistroHoraMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertRegistroHoraPayload) => horasService.upsert(payload),
    onSuccess: (registro) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          registro ? "Horas registradas" : "Registro del día eliminado",
          "success",
        );
      queryClient.invalidateQueries({ queryKey: HORAS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudieron registrar las horas"), "error");
    },
  });
};
