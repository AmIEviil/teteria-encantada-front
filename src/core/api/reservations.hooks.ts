import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { reservationsService } from "./reservations.service";
import type {
  CreateReservationPayload,
  FindReservationsFilters,
  UpdateReservationPayload,
} from "./types";

const RESERVATIONS_QUERY_KEY = ["reservations"] as const;

export const useReservationsQuery = (
  filters?: FindReservationsFilters,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      ...RESERVATIONS_QUERY_KEY,
      filters?.tableId ?? "all",
      filters?.status ?? "all",
      filters?.startDate ?? "all",
      filters?.endDate ?? "all",
    ],
    queryFn: () => reservationsService.findAll(filters),
    enabled,
  });
};

export const useCreateReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      reservationsService.create(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Reserva creada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear la reserva"), "error");
    },
  });
};

interface UpdateReservationMutationPayload {
  id: string;
  payload: UpdateReservationPayload;
}

export const useUpdateReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateReservationMutationPayload) =>
      reservationsService.update(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Reserva actualizada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar la reserva"),
          "error",
        );
    },
  });
};

export const useDeleteReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reservationsService.remove(id),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Reserva eliminada", "success");
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo eliminar la reserva"), "error");
    },
  });
};
