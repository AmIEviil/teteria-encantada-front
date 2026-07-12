import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import RefreshIcon from "@mui/icons-material/Refresh";
import TerminalIcon from "@mui/icons-material/Terminal";
import CaretIcon from "../../components/ui/icons/CaretIcon";
import { MigrationCommandModal } from "../../components/migrations/MigrationCommandModal";
import {
  useExecuteMigrationMutation,
  useMigrationsHistoryQuery,
  useMigrationsStatusQuery,
  useRevertMigrationMutation,
} from "../../core/api/migrations.hooks";
import type { MigrationHistoryItem, MigrationOrder } from "../../core/api/types";
import { MigrationStatusTable } from "./MigrationStatusTable/MigrationStatusTable";
import "./MigrationsView.css";

const formatIsoDate = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getHistoryUserLabel = (history: MigrationHistoryItem): string => {
  if (!history.user) {
    return "Desconocido";
  }

  const userName = history.user.name?.trim();

  if (userName) {
    return userName;
  }

  const firstName = history.user.first_name?.trim() || "";
  const lastName = history.user.last_name?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return "Desconocido";
};

const groupHistoryByMigration = (historyItems: MigrationHistoryItem[]) => {
  return historyItems.reduce<Record<string, MigrationHistoryItem[]>>((acc, item) => {
    if (!acc[item.migrationName]) {
      acc[item.migrationName] = [];
    }

    acc[item.migrationName].push(item);
    return acc;
  }, {});
};

export const MigrationsView = () => {
  const [order, setOrder] = useState<MigrationOrder>("asc");
  const [showExecuted, setShowExecuted] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);

  const {
    data: migrationData,
    isLoading: loadingStatus,
    isFetching: fetchingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useMigrationsStatusQuery(order);

  const {
    data: migrationHistory = [],
    isLoading: loadingHistory,
    isFetching: fetchingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useMigrationsHistoryQuery();

  const executeMutation = useExecuteMigrationMutation();
  const revertMutation = useRevertMigrationMutation();

  const groupedHistory = useMemo(() => {
    return groupHistoryByMigration(migrationHistory);
  }, [migrationHistory]);

  const handleRefresh = () => {
    void refetchStatus();
    void refetchHistory();
  };

  const handleExecute = async (migrationName: string) => {
    const approved = globalThis.confirm(
      `¿Estas seguro de ejecutar la migracion ${migrationName}?`,
    );

    if (!approved) {
      return;
    }

    await executeMutation.mutateAsync(migrationName);
  };

  const handleRevert = async (migrationName: string) => {
    const approved = globalThis.confirm(
      `¿Estas seguro de revertir la migracion ${migrationName}?`,
    );

    if (!approved) {
      return;
    }

    await revertMutation.mutateAsync(migrationName);
  };

  const loading = loadingStatus || loadingHistory;
  const refreshing = fetchingStatus || fetchingHistory;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Migraciones
          </Typography>
          <Typography color="text.secondary">
            Panel de soporte para revisar, ejecutar y revertir migraciones del backend.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<TerminalIcon />}
            onClick={() => setShowCommandModal(true)}
          >
            Ver comandos
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Recargar
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Cargando informacion de migraciones...</Typography>
          </Stack>
        </Paper>
      )}

      {statusError && (
        <Alert severity="error">No se pudo cargar el estado de migraciones.</Alert>
      )}

      {historyError && (
        <Alert severity="error">No se pudo cargar el historial de migraciones.</Alert>
      )}

      {migrationData && (
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              color="info"
              label={`Total migraciones en backend: ${migrationData.summary.totalMigrations}`}
            />
            <Chip
              color="success"
              label={`Ejecutadas: ${migrationData.summary.totalExecuted}`}
            />
            <Chip
              color="warning"
              label={`Pendientes: ${migrationData.summary.totalPending}`}
            />
          </Stack>
        </Paper>
      )}

      {migrationData && (
        <MigrationStatusTable
          title="Migraciones ejecutadas"
          open={showExecuted}
          onToggle={() => setShowExecuted((current) => !current)}
          rows={migrationData.executed}
          emptyLabel="No hay migraciones ejecutadas."
          actionLabel="Revertir"
          actionIcon={<ReplayIcon />}
          loadingAction={revertMutation.isPending}
          actionTargetName={revertMutation.variables}
          onAction={(migrationName) => {
            void handleRevert(migrationName);
          }}
          order={order}
          onToggleOrder={() => setOrder((current) => (current === "asc" ? "desc" : "asc"))}
        />
      )}

      {migrationData && (
        <MigrationStatusTable
          title="Migraciones pendientes"
          open={showPending}
          onToggle={() => setShowPending((current) => !current)}
          rows={migrationData.pending}
          emptyLabel="No hay migraciones pendientes."
          actionLabel="Ejecutar"
          actionIcon={<PlayArrowIcon />}
          loadingAction={executeMutation.isPending}
          actionTargetName={executeMutation.variables}
          onAction={(migrationName) => {
            void handleExecute(migrationName);
          }}
          order={order}
        />
      )}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <button
            type="button"
            className="migration-section-toggle"
            onClick={() => setShowHistory((current) => !current)}
          >
            <Typography variant="h6">Historial de migraciones</Typography>
            <CaretIcon direction={showHistory ? "down" : "right"} />
          </button>

          {showHistory && Object.keys(groupedHistory).length === 0 && (
            <Typography color="text.secondary">No hay historial registrado.</Typography>
          )}

          {showHistory &&
            Object.entries(groupedHistory).map(([migrationName, entries]) => (
              <Box key={migrationName} className="migration-history-card">
                <Typography variant="subtitle1" fontWeight={700}>
                  {migrationName}
                </Typography>

                <Table size="small" sx={{ mt: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Accion</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Mensaje de error</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.action === "EXECUTE" ? "Ejecutada" : "Revertida"}
                        </TableCell>
                        <TableCell>{getHistoryUserLabel(entry)}</TableCell>
                        <TableCell>{formatIsoDate(entry.executedAt)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={entry.success ? "success" : "error"}
                            label={entry.success ? "Exitoso" : "Fallido"}
                          />
                        </TableCell>
                        <TableCell>{entry.errorMessage || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ))}
        </Stack>
      </Paper>

      <MigrationCommandModal
        open={showCommandModal}
        onClose={() => setShowCommandModal(false)}
      />
    </Stack>
  );
};
