import apiClient from "../client/client";
import type {
  CreateLayoutPayload,
  RemoveResponse,
  SaveLayoutSnapshotPayload,
  TableLayout,
  UpdateLayoutPayload,
} from "./types";

export const layoutsService = {
  findAll: async (): Promise<TableLayout[]> => {
    const response = await apiClient.get<TableLayout[]>("/layouts");
    const payload = response.data as unknown;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === "object") {
      const maybeData = (payload as { data?: unknown }).data;
      if (Array.isArray(maybeData)) {
        return maybeData;
      }
    }

    return [];
  },
  findOne: async (id: string): Promise<TableLayout> => {
    const response = await apiClient.get<TableLayout>(`/layouts/${id}`);
    return response.data;
  },
  create: async (payload: CreateLayoutPayload): Promise<TableLayout> => {
    const response = await apiClient.post<TableLayout>("/layouts", payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateLayoutPayload): Promise<TableLayout> => {
    const response = await apiClient.patch<TableLayout>(`/layouts/${id}`, payload);
    return response.data;
  },
  createSnapshot: async (payload: SaveLayoutSnapshotPayload): Promise<TableLayout> => {
    const response = await apiClient.post<TableLayout>("/layouts/snapshot", payload);
    return response.data;
  },
  saveSnapshot: async (id: string, payload: SaveLayoutSnapshotPayload): Promise<TableLayout> => {
    const response = await apiClient.patch<TableLayout>(`/layouts/${id}/snapshot`, payload);
    return response.data;
  },
  remove: async (id: string): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(`/layouts/${id}`);
    return response.data;
  },
};
