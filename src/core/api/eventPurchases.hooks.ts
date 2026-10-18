import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { eventPurchasesService } from "./eventPurchases.service";
import type { EventPurchasesFilters } from "./types";

const EVENT_PURCHASES_QUERY_KEY = "event-purchases";

export const useEventPurchasesQuery = (
  filters: EventPurchasesFilters,
  enabled = true,
) => {
  return useQuery({
    queryKey: [EVENT_PURCHASES_QUERY_KEY, filters],
    queryFn: () => eventPurchasesService.findAll(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
};

export const useEventPurchaseDetailQuery = (id: string | null) => {
  return useQuery({
    queryKey: [EVENT_PURCHASES_QUERY_KEY, "detail", id],
    queryFn: () => eventPurchasesService.findOne(id as string),
    enabled: !!id,
  });
};
