import apiClient from "../client/client";
import type {
  CreateReservationPayload,
  FindReservationsFilters,
  Reservation,
  ReservationScheduleDay,
  RemoveResponse,
  UpdateReservationSchedulePayload,
  UpdateReservationPayload,
} from "./types";

export const reservationsService = {
  findAll: async (filters?: FindReservationsFilters): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>("/reservations", {
      params: {
        tableId: filters?.tableId,
        status: filters?.status,
        phone: filters?.phone,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
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
    }

    return [];
  },

  findOne: async (id: string): Promise<Reservation> => {
    const response = await apiClient.get<Reservation>(`/reservations/${id}`);
    return response.data;
  },

  create: async (payload: CreateReservationPayload): Promise<Reservation> => {
    const response = await apiClient.post<Reservation>("/reservations", payload);
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateReservationPayload,
  ): Promise<Reservation> => {
    const response = await apiClient.patch<Reservation>(`/reservations/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(`/reservations/${id}`);
    return response.data;
  },

  findSchedule: async (): Promise<ReservationScheduleDay[]> => {
    const response = await apiClient.get<ReservationScheduleDay[]>("/reservations/schedule");
    return response.data;
  },

  updateSchedule: async (
    payload: UpdateReservationSchedulePayload,
  ): Promise<ReservationScheduleDay[]> => {
    const response = await apiClient.put<ReservationScheduleDay[]>(
      "/reservations/schedule",
      payload,
    );
    return response.data;
  },
};
