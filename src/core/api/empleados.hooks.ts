import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { authService } from "./auth.service";
import { empleadosService } from "./empleados.service";
import type {
  AddWhitelistPayload,
  CreateTrabajadorPayload,
  FindEmpleadoUsersFilters,
  RegisterPayload,
  UpdateTrabajadorPayload,
} from "./types";

const EMPLEADOS_QUERY_KEY = ["empleados", "users"] as const;

export const useEmpleadosUsersQuery = (
  filters?: FindEmpleadoUsersFilters,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      ...EMPLEADOS_QUERY_KEY,
      filters?.page ?? 1,
      filters?.limit ?? 10,
      filters?.firstName ?? "",
      filters?.lastName ?? "",
      filters?.createdFrom ?? "",
      filters?.createdTo ?? "",
      filters?.onlyStaff ?? false,
    ],
    queryFn: () => empleadosService.findUsers(filters),
    enabled,
  });
};

export const useCreateTrabajadorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTrabajadorPayload) => empleadosService.create(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Trabajador creado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear el trabajador"), "error");
    },
  });
};

interface UpdateTrabajadorMutationPayload {
  id: string;
  payload: UpdateTrabajadorPayload;
}

export const useUpdateTrabajadorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateTrabajadorMutationPayload) =>
      empleadosService.update(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Trabajador actualizado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar el trabajador"),
          "error",
        );
    },
  });
};

export const useCreateEmpleadoUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.createUser(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Usuario creado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear el usuario"), "error");
    },
  });
};

export const useAddWhitelistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddWhitelistPayload) => empleadosService.addToWhitelist(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Correo agregado a la whitelist", "success");
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo agregar el correo"), "error");
    },
  });
};

interface SetWhitelistActivePayload {
  id: string;
  isActive: boolean;
}

export const useSetWhitelistActiveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: SetWhitelistActivePayload) =>
      empleadosService.setWhitelistActive(id, isActive),
    onSuccess: (user) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          user.isActive ? "Acceso habilitado" : "Acceso revocado",
          "success",
        );
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo actualizar el acceso"), "error");
    },
  });
};