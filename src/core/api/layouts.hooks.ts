import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { layoutsService } from "./layouts.service";
import type { CreateLayoutPayload, UpdateLayoutPayload } from "./types";

export const LAYOUTS_QUERY_KEY = ["layouts"] as const;

export const useLayoutsQuery = () => {
  return useQuery({
    queryKey: LAYOUTS_QUERY_KEY,
    queryFn: layoutsService.findAll,
  });
};

export const useCreateLayoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLayoutPayload) => layoutsService.create(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Layout creado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: LAYOUTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear el layout"), "error");
    },
  });
};

interface UpdateLayoutMutationPayload {
  id: string;
  payload: UpdateLayoutPayload;
}

export const useUpdateLayoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateLayoutMutationPayload) =>
      layoutsService.update(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Layout actualizado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: LAYOUTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar el layout"),
          "error",
        );
    },
  });
};

export const useDeleteLayoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => layoutsService.remove(id),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Layout eliminado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: LAYOUTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo eliminar el layout"), "error");
    },
  });
};
