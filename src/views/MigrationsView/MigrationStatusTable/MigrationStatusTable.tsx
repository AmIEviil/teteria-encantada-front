import {
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CaretIcon from "../../../components/ui/icons/CaretIcon";
import type { MigrationStatusTableProps } from "../../../service/migrations/migrations.interface";

const parseTimestampToDate = (timestamp: string | null): Date | null => {
  if (!timestamp) {
    return null;
  }

  const parsed = Number.parseInt(timestamp, 10);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
};

const formatTimestamp = (timestamp: string | null): string => {
  const parsedDate = parseTimestampToDate(timestamp);

  if (!parsedDate) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

export const MigrationStatusTable = ({
  title,
  open,
  onToggle,
  rows,
  emptyLabel,
  actionLabel,
  actionIcon,
  loadingAction,
  actionTargetName,
  onAction,
  order,
  onToggleOrder,
}: MigrationStatusTableProps) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <button type="button" className="migration-section-toggle" onClick={onToggle}>
          <Typography variant="h6">{title}</Typography>
          <CaretIcon direction={open ? "down" : "right"} />
        </button>

        {!open && (
          <Typography variant="body2" color="text.secondary">
            {rows.length} registradas
          </Typography>
        )}

        {open && rows.length === 0 && (
          <Typography color="text.secondary">{emptyLabel}</Typography>
        )}

        {open && rows.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>Fecha</span>
                    {onToggleOrder && (
                      <IconButton
                        size="small"
                        aria-label="Cambiar orden"
                        onClick={onToggleOrder}
                      >
                        <CaretIcon direction={order === "asc" ? "up" : "down"} />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((migration) => (
                <TableRow key={migration.name}>
                  <TableCell>{migration.name}</TableCell>
                  <TableCell>{formatTimestamp(migration.timestamp)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      color={actionLabel === "Revertir" ? "error" : "success"}
                      size="small"
                      startIcon={actionIcon}
                      disabled={loadingAction}
                      onClick={() => onAction(migration.name)}
                    >
                      {loadingAction && actionTargetName === migration.name
                        ? `${actionLabel}...`
                        : actionLabel}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Stack>
    </Paper>
  );
};
