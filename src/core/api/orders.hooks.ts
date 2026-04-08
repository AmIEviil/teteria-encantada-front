import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { ordersService } from "./orders.service";
import type {
  CreateOrderPayload,
  FindOrdersReportFilters,
  OrderStatus,
  UpdateOrderPayload,
} from "./types";

const ORDERS_QUERY_KEY = ["orders"] as const;
const ORDERS_REPORT_QUERY_KEY = ["orders", "report"] as const;
const PRODUCTS_QUERY_KEY = ["products"] as const;

interface UseOrdersQueryOptions {
  tableId?: string;
  status?: OrderStatus;
  enabled?: boolean;
}

export const useOrdersQuery = ({
  tableId,
  status,
  enabled = true,
}: UseOrdersQueryOptions) => {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, tableId ?? "all", status ?? "all"],
    queryFn: () => ordersService.findAll({ tableId, status }),
    enabled,
  });
};

interface UseOrdersReportQueryOptions {
  filters: FindOrdersReportFilters;
  enabled?: boolean;
}

export const useOrdersReportQuery = ({
  filters,
  enabled = true,
}: UseOrdersReportQueryOptions) => {
  return useQuery({
    queryKey: [
      ...ORDERS_REPORT_QUERY_KEY,
      filters.tableId ?? "all",
      filters.status ?? "all",
      filters.startDate ?? "all",
      filters.endDate ?? "all",
      filters.search ?? "",
      filters.page ?? 1,
      filters.limit ?? 10,
      filters.orderBy ?? "createdAt",
      filters.orderDirection ?? "DESC",
    ],
    queryFn: () => ordersService.findReport(filters),
    enabled,
  });
};

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersService.create(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Orden creada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear la orden"), "error");
    },
  });
};

interface UpdateOrderMutationPayload {
  id: string;
  payload: UpdateOrderPayload;
}

export const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateOrderMutationPayload) =>
      ordersService.update(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Orden actualizada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo actualizar la orden"), "error");
    },
  });
};

export const useDeleteOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.remove(id),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Orden eliminada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo eliminar la orden"), "error");
    },
  });
};
