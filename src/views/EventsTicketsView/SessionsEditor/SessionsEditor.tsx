import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import type { SessionDraft } from "../../../service/events/events.interface";
import {
  createEmptySessionDraft,
  getEndTimeOptions,
  getNextFreeStartTime,
  getStartTimeOptions,
} from "../eventSessions.utils";

interface SessionsEditorProps {
  sameSessionsEveryDay: boolean;
  baseSessions: SessionDraft[];
  sessionsByDate: Record<string, SessionDraft[]>;
  dateKeys: string[];
  minTime: string;
  maxTime: string;
  formatDateLabel: (dateKey: string) => string;
  onToggleSameEveryDay: (checked: boolean) => void;
  onBaseSessionsChange: (sessions: SessionDraft[]) => void;
  onDaySessionsChange: (date: string, sessions: SessionDraft[]) => void;
}

const updateSession = (
  sessions: SessionDraft[],
  sessionId: string,
  field: keyof Omit<SessionDraft, "id">,
  value: string,
): SessionDraft[] =>
  sessions.map((session) =>
    session.id === sessionId ? { ...session, [field]: value } : session,
  );

const removeSession = (
  sessions: SessionDraft[],
  sessionId: string,
): SessionDraft[] => {
  const next = sessions.filter((session) => session.id !== sessionId);

  return next.length > 0 ? next : [createEmptySessionDraft()];
};

const SessionRows = ({
  sessions,
  minTime,
  maxTime,
  onChange,
}: {
  sessions: SessionDraft[];
  minTime: string;
  maxTime: string;
  onChange: (sessions: SessionDraft[]) => void;
}) => (
  <Stack spacing={1}>
    {sessions.map((session, index) => (
      <Stack
        key={session.id}
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ md: "center" }}
      >
        <TextField
          select
          label={`Jornada ${index + 1} - inicio`}
          value={session.startTime}
          onChange={(event) => {
            const nextStartTime = event.target.value;

            onChange(
              sessions.map((current) =>
                current.id === session.id
                  ? {
                      ...current,
                      startTime: nextStartTime,
                      endTime:
                        current.endTime && current.endTime > nextStartTime
                          ? current.endTime
                          : "",
                    }
                  : current,
              ),
            );
          }}
          sx={{ minWidth: 170 }}
        >
          {getStartTimeOptions(session, sessions, minTime, maxTime).map(
            (timeOption) => (
              <MenuItem key={timeOption.value} value={timeOption.value}>
                {timeOption.label}
              </MenuItem>
            ),
          )}
        </TextField>

        <TextField
          select
          label="Termino (opcional)"
          value={session.endTime}
          onChange={(event) =>
            onChange(
              updateSession(sessions, session.id, "endTime", event.target.value),
            )
          }
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">Sin definir</MenuItem>
          {getEndTimeOptions(session, sessions, minTime, maxTime).map(
            (timeOption) => (
              <MenuItem key={timeOption.value} value={timeOption.value}>
                {timeOption.label}
              </MenuItem>
            ),
          )}
        </TextField>

        <TextField
          label="Capacidad"
          type="number"
          value={session.capacity}
          onChange={(event) =>
            onChange(
              updateSession(sessions, session.id, "capacity", event.target.value),
            )
          }
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          sx={{ minWidth: 140 }}
        />

        <TextField
          label="Nombre / actividad (opcional)"
          value={session.name ?? ""}
          onChange={(event) =>
            onChange(
              updateSession(sessions, session.id, "name", event.target.value),
            )
          }
          sx={{ minWidth: 200 }}
        />

        <IconButton
          onClick={() => onChange(removeSession(sessions, session.id))}
          aria-label={`Eliminar jornada ${index + 1}`}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
    ))}

    <Button
      size="small"
      startIcon={<AddIcon />}
      onClick={() =>
        onChange([
          ...sessions,
          createEmptySessionDraft(
            getNextFreeStartTime(sessions, minTime, maxTime),
          ),
        ])
      }
      sx={{ alignSelf: "flex-start" }}
    >
      Agregar jornada
    </Button>
  </Stack>
);

export const SessionsEditor = ({
  sameSessionsEveryDay,
  baseSessions,
  sessionsByDate,
  dateKeys,
  minTime,
  maxTime,
  formatDateLabel,
  onToggleSameEveryDay,
  onBaseSessionsChange,
  onDaySessionsChange,
}: SessionsEditorProps) => {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.25}>
        <Typography fontWeight={700}>Jornadas del evento</Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={sameSessionsEveryDay}
              onChange={(event) => onToggleSameEveryDay(event.target.checked)}
            />
          }
          label="Mismos horarios todos los dias"
        />

        {dateKeys.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Define primero el rango de fechas del evento.
          </Typography>
        )}

        {sameSessionsEveryDay ? (
          <SessionRows
            sessions={baseSessions}
            minTime={minTime}
            maxTime={maxTime}
            onChange={onBaseSessionsChange}
          />
        ) : (
          <Stack spacing={1.25}>
            {dateKeys.map((date) => (
              <Paper key={date} variant="outlined" sx={{ p: 1.25 }}>
                <Stack spacing={1}>
                  <Typography fontWeight={600}>{formatDateLabel(date)}</Typography>
                  <SessionRows
                    sessions={sessionsByDate[date] ?? []}
                    minTime={minTime}
                    maxTime={maxTime}
                    onChange={(sessions) => onDaySessionsChange(date, sessions)}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
