import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { eventsService } from "./events.service";
import type {
  CreateEventTicketPayload,
  CreateVenueEventPayload,
  FindEventsFilters,
  FindEventTicketsFilters,
  UpdateEventStatusPayload,
  UpdateEventTicketPayload,
  UpdateVenueEventPayload,
} from "./types";

const EVENTS_QUERY_KEY = ["events"] as const;
const EVENT_TICKETS_QUERY_KEY = ["event-tickets"] as const;

export const useEventsQuery = (filters?: FindEventsFilters, enabled = true) => {
  return useQuery({
    queryKey: [
      ...EVENTS_QUERY_KEY,
      filters?.status ?? "all",
      filters?.search ?? "",
      filters?.startDate ?? "all",
      filters?.endDate ?? "all",
    ],
    queryFn: () => eventsService.findAll(filters),
    enabled,
  });
};

export const useEventTicketsQuery = (
  eventId?: string,
  filters?: FindEventTicketsFilters,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      ...EVENT_TICKETS_QUERY_KEY,
      eventId ?? "none",
      filters?.ticketTypeId ?? "all",
      filters?.attendanceDate ?? "all",
      filters?.status ?? "all",
    ],
    queryFn: () => {
      if (!eventId) {
        return Promise.resolve([]);
      }

      return eventsService.findTickets(eventId, filters);
    },
    enabled: enabled && Boolean(eventId),
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVenueEventPayload) => eventsService.create(payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Evento creado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo crear el evento"), "error");
    },
  });
};

interface UpdateEventMutationPayload {
  id: string;
  payload: UpdateVenueEventPayload;
}

export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateEventMutationPayload) =>
      eventsService.update(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Evento actualizado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EVENT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar el evento"),
          "error",
        );
    },
  });
};

interface UpdateEventStatusMutationPayload {
  id: string;
  payload: UpdateEventStatusPayload;
}

export const useUpdateEventStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateEventStatusMutationPayload) =>
      eventsService.updateStatus(id, payload),
    onSuccess: () => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Estado del evento actualizado", "success");
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EVENT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar el estado"),
          "error",
        );
    },
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.remove(eventId),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Evento eliminado", "success");
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EVENT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo eliminar el evento"), "error");
    },
  });
};

interface CreateEventTicketMutationPayload {
  eventId: string;
  payload: CreateEventTicketPayload;
}

export const useCreateEventTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, payload }: CreateEventTicketMutationPayload) =>
      eventsService.createTicket(eventId, payload),
    onSuccess: (createdTickets, variables) => {
      const createdCount = createdTickets.length;
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          createdCount > 1
            ? `${createdCount} tickets registrados correctamente`
            : "Ticket registrado correctamente",
          "success",
        );
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...EVENT_TICKETS_QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: EVENT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo registrar el ticket"), "error");
    },
  });
};

interface UpdateEventTicketMutationPayload {
  eventId: string;
  ticketId: string;
  payload: UpdateEventTicketPayload;
}

export const useUpdateEventTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, ticketId, payload }: UpdateEventTicketMutationPayload) =>
      eventsService.updateTicket(eventId, ticketId, payload),
    onSuccess: (_, variables) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Ticket actualizado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...EVENT_TICKETS_QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: EVENT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo actualizar el ticket"),
          "error",
        );
    },
  });
};

interface DeleteEventTicketMutationPayload {
  eventId: string;
  ticketId: string;
}

export const useDeleteEventTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, ticketId }: DeleteEventTicketMutationPayload) =>
      eventsService.removeTicket(eventId, ticketId),
    onSuccess: (response, variables) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Ticket eliminado", "success");
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...EVENT_TICKETS_QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: EVENT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo eliminar el ticket"), "error");
    },
  });
};
