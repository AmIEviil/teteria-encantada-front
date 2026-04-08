import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { migrationsService } from "./migrations.service";
import type { MigrationOrder } from "./types";

const MIGRATIONS_STATUS_QUERY_KEY = ["migrations", "status"] as const;
const MIGRATIONS_HISTORY_QUERY_KEY = ["migrations", "history"] as const;

export const useMigrationsStatusQuery = (order: MigrationOrder) => {
  return useQuery({
    queryKey: [...MIGRATIONS_STATUS_QUERY_KEY, order],
    queryFn: () => migrationsService.getStatus(order),
  });
};

export const useMigrationsHistoryQuery = (migrationName?: string) => {
  return useQuery({
    queryKey: [...MIGRATIONS_HISTORY_QUERY_KEY, migrationName ?? "all"],
    queryFn: () => migrationsService.getHistory(migrationName),
  });
};

export const useExecuteMigrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (migrationName: string) =>
      migrationsService.executeMigration(migrationName),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Migracion ejecutada correctamente", "success");
      queryClient.invalidateQueries({ queryKey: MIGRATIONS_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MIGRATIONS_HISTORY_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo ejecutar la migracion"),
          "error",
        );
    },
  });
};

export const useRevertMigrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (migrationName: string) =>
      migrationsService.revertMigration(migrationName),
    onSuccess: (response) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(response.message || "Migracion revertida correctamente", "success");
      queryClient.invalidateQueries({ queryKey: MIGRATIONS_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MIGRATIONS_HISTORY_QUERY_KEY });
    },
    onError: (error) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(
          getApiErrorMessage(error, "No se pudo revertir la migracion"),
          "error",
        );
    },
  });
};
