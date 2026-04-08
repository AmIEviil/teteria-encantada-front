import { useQuery } from "@tanstack/react-query";
import { tablesService } from "./tables.service";

const TABLES_QUERY_KEY = ["tables"] as const;

export const useTablesQuery = (layoutId?: string, enabled = true) => {
  return useQuery({
    queryKey: [...TABLES_QUERY_KEY, layoutId ?? "all"],
    queryFn: () => tablesService.findAll(layoutId),
    enabled,
  });
};
