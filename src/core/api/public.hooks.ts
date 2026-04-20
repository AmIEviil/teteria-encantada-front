import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicService } from "./public.service";
import type { CreateReservationPayload, FindPublicReservationsFilters } from "./types";

const PUBLIC_MENU_QUERY_KEY = ["public-menu"] as const;
const PUBLIC_TABLES_QUERY_KEY = ["public-tables"] as const;
const PUBLIC_RESERVATIONS_QUERY_KEY = ["public-reservations"] as const;
const PUBLIC_RESERVATIONS_SCHEDULE_QUERY_KEY = ["public-reservations-schedule"] as const;

export const usePublicMenuQuery = () => {
  return useQuery({
    queryKey: PUBLIC_MENU_QUERY_KEY,
    queryFn: publicService.findMenu,
  });
};

export const usePublicTablesQuery = () => {
  return useQuery({
    queryKey: PUBLIC_TABLES_QUERY_KEY,
    queryFn: publicService.findTables,
  });
};

export const usePublicReservationsQuery = (
  filters?: FindPublicReservationsFilters,
  enabled = true,
) => {
  return useQuery({
    queryKey: [
      ...PUBLIC_RESERVATIONS_QUERY_KEY,
      filters?.email ?? "no-email",
      filters?.phone ?? "no-phone",
      filters?.tableId ?? "all",
      filters?.status ?? "all",
      filters?.startDate ?? "all",
      filters?.endDate ?? "all",
    ],
    queryFn: () => publicService.findReservations(filters),
    enabled,
  });
};

export const usePublicCreateReservationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationPayload) =>
      publicService.createReservation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUBLIC_RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_TABLES_QUERY_KEY });
    },
  });
};

export const usePublicReservationScheduleQuery = () => {
  return useQuery({
    queryKey: PUBLIC_RESERVATIONS_SCHEDULE_QUERY_KEY,
    queryFn: publicService.findReservationSchedule,
  });
};
