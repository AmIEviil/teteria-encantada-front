import apiClient from "../client/client";
import type {
  CreateProductPayload,
  Product,
  RemoveResponse,
  UpdateProductPayload,
} from "./types";

export const productsService = {
  findAll: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>("/products");

    const payload = response.data as unknown;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === "object") {
      const maybeData = (payload as { data?: unknown }).data;
      if (Array.isArray(maybeData)) {
        return maybeData;
      }

      const maybeItems = (payload as { items?: unknown }).items;
      if (Array.isArray(maybeItems)) {
        return maybeItems;
      }
    }

    return [];
  },
  findOne: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },
  create: async (payload: CreateProductPayload): Promise<Product> => {
    const response = await apiClient.post<Product>("/products", payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateProductPayload): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}`, payload);
    return response.data;
  },
  remove: async (id: string): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(`/products/${id}`);
    return response.data;
  },
};
