import apiClient from "../client/client";
import type {
  MigrationActionResponse,
  MigrationBatchResponse,
  MigrationHistoryItem,
  MigrationOrder,
  MigrationsStatusResponse,
} from "./types";

interface RawMigrationStatusItem {
  name?: unknown;
  timestamp?: unknown;
}

interface RawMigrationHistoryItem {
  id?: unknown;
  migrationName?: unknown;
  migration_name?: unknown;
  action?: unknown;
  userId?: unknown;
  user_id?: unknown;
  user?: unknown;
  details?: unknown;
  success?: unknown;
  errorMessage?: unknown;
  error_message?: unknown;
  executedAt?: unknown;
  executed_at?: unknown;
}

const getStringValue = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
};

const getNullableStringValue = (...values: unknown[]): string | null => {
  return getStringValue(...values) ?? null;
};

const getTimestampString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const getObjectOrNull = <T extends object>(value: unknown): T | null => {
  if (value && typeof value === "object") {
    return value as T;
  }

  return null;
};

const normalizeStatusItem = (item: RawMigrationStatusItem) => {
  const name = typeof item.name === "string" ? item.name : "";
  const timestamp = getTimestampString(item.timestamp);

  return {
    name,
    timestamp,
  };
};

const normalizeHistoryItem = (
  item: RawMigrationHistoryItem,
): MigrationHistoryItem | null => {
  const id = getStringValue(item.id) ?? "";
  const migrationNameRaw = getStringValue(item.migrationName, item.migration_name) ?? "";
  const action = item.action === "REVERT" ? "REVERT" : "EXECUTE";
  const userIdRaw = getNullableStringValue(item.userId, item.user_id);
  const success = Boolean(item.success);
  const errorMessageRaw = getNullableStringValue(item.errorMessage, item.error_message);
  const executedAtRaw = getStringValue(item.executedAt, item.executed_at) ?? "";
  const userRaw = getObjectOrNull<MigrationHistoryItem["user"]>(item.user);
  const detailsRaw = getObjectOrNull<Record<string, unknown>>(item.details);

  if (!id || !migrationNameRaw || !executedAtRaw) {
    return null;
  }

  return {
    id,
    migrationName: migrationNameRaw,
    action,
    userId: userIdRaw,
    user: userRaw,
    details: detailsRaw,
    success,
    errorMessage: errorMessageRaw,
    executedAt: executedAtRaw,
  };
};

const getEmptyMigrationsStatus = (order: MigrationOrder): MigrationsStatusResponse => {
  return {
    executed: [],
    pending: [],
    order,
    summary: {
      totalExecuted: 0,
      totalPending: 0,
      totalMigrations: 0,
    },
  };
};

export const migrationsService = {
  getStatus: async (order: MigrationOrder): Promise<MigrationsStatusResponse> => {
    const response = await apiClient.get<unknown>(
      "/migrations/status",
      {
        params: { order },
      },
    );

    const payload = response.data;

    if (!payload || typeof payload !== "object") {
      return getEmptyMigrationsStatus(order);
    }

    const typedPayload = payload as Partial<MigrationsStatusResponse> & {
      executed?: RawMigrationStatusItem[];
      pending?: RawMigrationStatusItem[];
    };

    const executed = Array.isArray(typedPayload.executed)
      ? typedPayload.executed.map(normalizeStatusItem).filter((item) => item.name.length > 0)
      : [];
    const pending = Array.isArray(typedPayload.pending)
      ? typedPayload.pending.map(normalizeStatusItem).filter((item) => item.name.length > 0)
      : [];

    return {
      executed,
      pending,
      order: typedPayload.order === "desc" ? "desc" : "asc",
      summary: {
        totalExecuted:
          typeof typedPayload.summary?.totalExecuted === "number"
            ? typedPayload.summary.totalExecuted
            : executed.length,
        totalPending:
          typeof typedPayload.summary?.totalPending === "number"
            ? typedPayload.summary.totalPending
            : pending.length,
        totalMigrations:
          typeof typedPayload.summary?.totalMigrations === "number"
            ? typedPayload.summary.totalMigrations
            : executed.length + pending.length,
      },
    };
  },

  getHistory: async (migrationName?: string): Promise<MigrationHistoryItem[]> => {
    const response = await apiClient.get<unknown>(
      "/migrations/history",
      {
        params: {
          migrationName,
        },
      },
    );

    const payload = response.data;

    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map((item) => normalizeHistoryItem(item as RawMigrationHistoryItem))
      .filter((item): item is MigrationHistoryItem => Boolean(item));
  },

  executeMigration: async (migrationName: string): Promise<MigrationActionResponse> => {
    const response = await apiClient.post<MigrationActionResponse>(
      "/migrations/execute",
      {
        migrationName,
      },
    );

    return response.data;
  },

  revertMigration: async (migrationName: string): Promise<MigrationActionResponse> => {
    const response = await apiClient.post<MigrationActionResponse>(
      "/migrations/revert",
      {
        migrationName,
      },
    );

    return response.data;
  },

  executeAllPending: async (): Promise<MigrationBatchResponse> => {
    const response = await apiClient.post<MigrationBatchResponse>(
      "/migrations/execute-all",
    );

    return response.data;
  },

  revertLastMigration: async (): Promise<MigrationBatchResponse> => {
    const response = await apiClient.post<MigrationBatchResponse>(
      "/migrations/revert-last",
    );

    return response.data;
  },
};
