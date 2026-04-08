import apiClient from "../client/client";
import type {
  CreateTablePayload,
  RemoveResponse,
  RestaurantTable,
  UpdateTablePayload,
} from "./types";

export const tablesService = {
  findAll: async (layoutId?: string): Promise<RestaurantTable[]> => {
    const response = await apiClient.get<RestaurantTable[]>("/tables", {
      params: { layoutId },
    });

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
  findOne: async (id: string): Promise<RestaurantTable> => {
    const response = await apiClient.get<RestaurantTable>(`/tables/${id}`);
    return response.data;
  },
  create: async (payload: CreateTablePayload): Promise<RestaurantTable> => {
    const response = await apiClient.post<RestaurantTable>("/tables", payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateTablePayload): Promise<RestaurantTable> => {
    const response = await apiClient.patch<RestaurantTable>(`/tables/${id}`, payload);
    return response.data;
  },
  remove: async (id: string): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(`/tables/${id}`);
    return response.data;
  },
};
