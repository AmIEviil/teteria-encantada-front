import * as ReactQuery from "@tanstack/react-query";
import { getApiErrorMessage } from "./apiError";
import { productsService } from "./products.service";
import type { CreateProductPayload, Product, UpdateProductPayload } from "./types";
import { useSnackBarResponseStore } from "../../store/snackBarStore";

const PRODUCTS_QUERY_KEY = ["products"] as const;

export const useProductQuery = (productId?: string, enabled = true) => {
  return ReactQuery.useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, "detail", productId ?? "none"],
    queryFn: () => productsService.findOne(productId ?? ""),
    enabled: enabled && Boolean(productId),
  });
};

export const useProductsQuery = () => {
  return ReactQuery.useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: productsService.findAll,
  });
};

export const useCreateProductMutation = () => {
  const queryClient = ReactQuery.useQueryClient();

  return ReactQuery.useMutation({
    mutationFn: (payload: CreateProductPayload) => productsService.create(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Producto creado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear el producto"), "error");
    },
  });
};

interface UpdateProductMutationPayload {
  id: string;
  payload: UpdateProductPayload;
}

export const useUpdateProductMutation = () => {
  const queryClient = ReactQuery.useQueryClient();

  return ReactQuery.useMutation({
    mutationFn: ({ id, payload }: UpdateProductMutationPayload) =>
      productsService.update(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Producto actualizado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar el producto"),
          "error",
        );
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = ReactQuery.useQueryClient();

  return ReactQuery.useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Producto eliminado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo eliminar el producto"), "error");
    },
  });
};

export const getProductByIdFromCache = (
  products: Product[] | undefined,
  productId: string,
): Product | undefined => {
  return products?.find((product) => product.id === productId);
};
