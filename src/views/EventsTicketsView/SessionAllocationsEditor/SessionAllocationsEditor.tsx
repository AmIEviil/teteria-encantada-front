import { Paper, Stack, TextField, Typography } from "@mui/material";
import type {
  SessionOccurrence,
  TicketTypeDraft,
} from "../../../service/events/events.interface";

interface SessionAllocationsEditorProps {
  occurrences: SessionOccurrence[];
  ticketTypes: TicketTypeDraft[];
  sessionAllocations: Record<string, Record<string, string>>;
  formatDateLabel: (dateKey: string) => string;
  onAllocationChange: (
    occurrenceKey: string,
    ticketTypeId: string,
    value: string,
  ) => void;
}

export const SessionAllocationsEditor = ({
  occurrences,
  ticketTypes,
  sessionAllocations,
  formatDateLabel,
  onAllocationChange,
}: SessionAllocationsEditorProps) => {
  if (occurrences.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Configura las jornadas del evento en el paso anterior.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      <Typography variant="h6">Cupos por jornada (opcional por tipo)</Typography>
      <Typography variant="body2" color="text.secondary">
        Si dejas un tipo sin cupo, se vende libre dentro de la capacidad de la
        jornada.
      </Typography>

      {occurrences.map((occurrence) => {
        const allocationsByType = sessionAllocations[occurrence.key] ?? {};
        const capacity = Number(occurrence.capacity) || 0;
        const allocationTotal = ticketTypes.reduce((total, ticketType) => {
          const value = Number((allocationsByType[ticketType.id] ?? "").trim());

          return Number.isInteger(value) && value > 0 ? total + value : total;
        }, 0);
        const exceedsCapacity = allocationTotal > capacity;

        return (
          <Paper key={occurrence.key} variant="outlined" sx={{ p: 1.25 }}>
            <Stack spacing={1}>
              <Typography fontWeight={600}>
                {formatDateLabel(occurrence.date)} {occurrence.startTime}
                {occurrence.endTime ? ` - ${occurrence.endTime}` : ""} | Capacidad:{" "}
                {occurrence.capacity || "0"}
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                {ticketTypes.map((ticketType, index) => (
                  <TextField
                    key={ticketType.id}
                    label={ticketType.name.trim() || `Tipo ${index + 1}`}
                    type="number"
                    value={allocationsByType[ticketType.id] ?? ""}
                    onChange={(event) =>
                      onAllocationChange(
                        occurrence.key,
                        ticketType.id,
                        event.target.value,
                      )
                    }
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    sx={{ minWidth: 140 }}
                  />
                ))}
              </Stack>

              {exceedsCapacity && (
                <Typography variant="body2" color="error.main">
                  La suma de cupos ({allocationTotal}) supera la capacidad de la
                  jornada ({capacity}).
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};
