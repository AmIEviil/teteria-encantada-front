import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useUpsertRegistroHoraMutation } from "../../core/api/horas.hooks";
import { clampHoras, HORA_STEP, MAX_HORAS } from "../../utils/horas.utils";

interface RegistrarHorasModalProps {
  open: boolean;
  trabajadorId?: string;
  horasPorFecha: Record<string, number>;
  onClose: () => void;
}

export const RegistrarHorasModal = ({
  open,
  trabajadorId,
  horasPorFecha,
  onClose,
}: RegistrarHorasModalProps) => {
  const [fecha, setFecha] = useState<Dayjs>(dayjs());
  const [horas, setHoras] = useState("8");
  const [lastSyncKey, setLastSyncKey] = useState<string | null>(null);
  const upsertMutation = useUpsertRegistroHoraMutation();

  const fechaKey = fecha.format("YYYY-MM-DD");
  const horasGuardadas = horasPorFecha[fechaKey] ?? 8;
  const syncKey = `${fechaKey}:${horasGuardadas}`;

  // Al cambiar de día (o al llegar el dato guardado), precargar las horas
  // ya registradas para ese día. Se ajusta en render, no en un efecto, para
  // evitar un ciclo extra de renders.
  if (syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey);
    setHoras(String(horasGuardadas));
  }

  const stepHoras = (delta: number) => {
    setHoras(String(clampHoras(Number(horas) + delta)));
  };

  const handleSubmit = async () => {
    await upsertMutation.mutateAsync({
      trabajadorId,
      fecha: fechaKey,
      horas: clampHoras(Number(horas)),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Registrar HH</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DatePicker
              label="Día"
              value={fecha}
              disableFuture
              onChange={(value) => {
                if (value?.isValid()) {
                  setFecha(value);
                }
              }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={() => stepHoras(-HORA_STEP)}
              disabled={clampHoras(Number(horas)) <= 0}
              aria-label="Restar media hora"
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              label="Horas"
              type="number"
              value={horas}
              onChange={(event) => setHoras(event.target.value)}
              onBlur={() => setHoras(String(clampHoras(Number(horas))))}
              inputProps={{ step: HORA_STEP, min: 0, max: MAX_HORAS }}
              fullWidth
            />
            <IconButton
              onClick={() => stepHoras(HORA_STEP)}
              disabled={clampHoras(Number(horas)) >= MAX_HORAS}
              aria-label="Sumar media hora"
            >
              <AddIcon />
            </IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Se suma o resta de 0.5 en 0.5. Con 0 horas se borra el registro del día.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
