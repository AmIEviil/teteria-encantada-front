import apiClient from "../client/client";
import type {
  CreateReservationPayload,
  FindPublicReservationsFilters,
  PublicEvent,
  PublicMenuItem,
  PublicReservation,
  ReservationScheduleDay,
  PublicTable,
} from "./types";
import type { PublicEventDetail } from "./publicEvents.types";

const normalizeArrayPayload = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData as T[];
    }

    const maybeItems = (payload as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems as T[];
    }
  }

  return [];
};

export const publicService = {
  findMenu: async (): Promise<PublicMenuItem[]> => {
    const response = await apiClient.get<PublicMenuItem[]>("/public/menu");
    return normalizeArrayPayload<PublicMenuItem>(response.data);
  },

  findTables: async (): Promise<PublicTable[]> => {
    const response = await apiClient.get<PublicTable[]>("/public/tables");
    return normalizeArrayPayload<PublicTable>(response.data);
  },

  findEvents: async (): Promise<PublicEvent[]> => {
    const response = await apiClient.get<PublicEvent[]>("/public/events");
    return normalizeArrayPayload<PublicEvent>(response.data);
  },

  findReservations: async (
    filters?: FindPublicReservationsFilters,
  ): Promise<PublicReservation[]> => {
    const response = await apiClient.get<PublicReservation[]>("/public/reservations", {
      params: {
        email: filters?.email,
        phone: filters?.phone,
        tableId: filters?.tableId,
        status: filters?.status,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
    });

    return normalizeArrayPayload<PublicReservation>(response.data);
  },

  createReservation: async (
    payload: CreateReservationPayload,
  ): Promise<PublicReservation> => {
    const response = await apiClient.post<PublicReservation>("/public/reservations", payload);
    return response.data;
  },

  findReservationSchedule: async (): Promise<ReservationScheduleDay[]> => {
    const response = await apiClient.get<ReservationScheduleDay[]>(
      "/public/reservations/schedule",
    );

    return normalizeArrayPayload<ReservationScheduleDay>(response.data);
  },

  findEventDetail: async (id: string): Promise<PublicEventDetail> => {
    const response = await apiClient.get<PublicEventDetail>(`/public/events/${id}`);
    return response.data;
  },
};
