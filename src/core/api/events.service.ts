import apiClient from "../client/client";
import type {
  CreateEventTicketPayload,
  CreateVenueEventPayload,
  EventTicket,
  FindEventsFilters,
  FindEventTicketsFilters,
  RemoveResponse,
  UpdateEventStatusPayload,
  UpdateEventTicketPayload,
  UpdateVenueEventPayload,
  VenueEvent,
} from "./types";

export const eventsService = {
  findAll: async (filters?: FindEventsFilters): Promise<VenueEvent[]> => {
    const response = await apiClient.get<VenueEvent[]>("/events", {
      params: {
        status: filters?.status,
        search: filters?.search,
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

  findOne: async (eventId: string): Promise<VenueEvent> => {
    const response = await apiClient.get<VenueEvent>(`/events/${eventId}`);
    return response.data;
  },

  create: async (payload: CreateVenueEventPayload): Promise<VenueEvent> => {
    const response = await apiClient.post<VenueEvent>("/events", payload);
    return response.data;
  },

  update: async (
    eventId: string,
    payload: UpdateVenueEventPayload,
  ): Promise<VenueEvent> => {
    const response = await apiClient.patch<VenueEvent>(
      `/events/${eventId}`,
      payload,
    );
    return response.data;
  },

  updateStatus: async (
    eventId: string,
    payload: UpdateEventStatusPayload,
  ): Promise<VenueEvent> => {
    const response = await apiClient.patch<VenueEvent>(
      `/events/${eventId}/status`,
      payload,
    );
    return response.data;
  },

  remove: async (eventId: string): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(`/events/${eventId}`);
    return response.data;
  },

  findTickets: async (
    eventId: string,
    filters?: FindEventTicketsFilters,
  ): Promise<EventTicket[]> => {
    const response = await apiClient.get<EventTicket[]>(`/events/${eventId}/tickets`, {
      params: {
        ticketTypeId: filters?.ticketTypeId,
        attendanceDate: filters?.attendanceDate,
        status: filters?.status,
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

  createTicket: async (
    eventId: string,
    payload: CreateEventTicketPayload,
  ): Promise<EventTicket[]> => {
    const response = await apiClient.post<EventTicket[]>(
      `/events/${eventId}/tickets`,
      payload,
    );
    return response.data;
  },

  updateTicket: async (
    eventId: string,
    ticketId: string,
    payload: UpdateEventTicketPayload,
  ): Promise<EventTicket> => {
    const response = await apiClient.patch<EventTicket>(
      `/events/${eventId}/tickets/${ticketId}`,
      payload,
    );
    return response.data;
  },

  removeTicket: async (
    eventId: string,
    ticketId: string,
  ): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(
      `/events/${eventId}/tickets/${ticketId}`,
    );
    return response.data;
  },
};
