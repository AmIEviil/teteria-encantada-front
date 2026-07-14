import { useMemo, useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
  Alert,
  Badge,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import axios from "axios";
import { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import { useEmpleadosUsersQuery } from "../../core/api/empleados.hooks";
import { useRegistroHorasQuery } from "../../core/api/horas.hooks";
import { RegistrarHorasModal } from "./RegistrarHorasModal";
import { nowInSantiago } from "../../utils/santiagoDate.utils";

interface HorasTabProps {
  isAdmin: boolean;
}

export const HorasTab = ({ isAdmin }: HorasTabProps) => {
  const [mes, setMes] = useState<Dayjs>(() => nowInSantiago());
  const [trabajadorId, setTrabajadorId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const empleadosQuery = useEmpleadosUsersQuery(
    { page: 1, limit: 100, onlyStaff: true },
    isAdmin,
  );

  const empleadosConFicha = (empleadosQuery.data?.items ?? []).filter(
    (user) => user.trabajador?.id,
  );

  // Un admin sin empleado elegido consulta sus propias horas (trabajadorId undefined).
  const { data, isLoading, isError, error } = useRegistroHorasQuery(
    mes.format("YYYY-MM"),
    trabajadorId || undefined,
  );

  const sinFichaPropia =
    isError &&
    axios.isAxiosError(error) &&
    error.response?.status === 404;

  const horasPorFecha = useMemo(() => {
    const map: Record<string, number> = {};

    for (const item of data?.items ?? []) {
      map[item.fecha] = item.horas;
    }

    return map;
  }, [data]);

  const renderDay = (props: PickersDayProps) => {
    const horas = horasPorFecha[props.day.format("YYYY-MM-DD")];

    return (
      <Badge
        key={props.day.toString()}
        overlap="circular"
        badgeContent={horas ? String(horas) : undefined}
        color="primary"
      >
        <PickersDay {...props} />
      </Badge>
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Registro de HH
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Horas trabajadas por día. Se registran en tramos de 0.5.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AccessTimeIcon />}
          onClick={() => setModalOpen(true)}
        >
          Registrar HH
        </Button>
      </Stack>

      {isAdmin && (
        <TextField
          select
          label="Empleado"
          value={trabajadorId}
          onChange={(event) => setTrabajadorId(event.target.value)}
          sx={{ maxWidth: 360 }}
        >
          <MenuItem value="">Mis horas</MenuItem>
          {empleadosConFicha.map((user) => (
            <MenuItem key={user.id} value={user.trabajador?.id ?? ""}>
              {`${user.first_name} ${user.last_name ?? ""}`.trim()} — {user.email}
            </MenuItem>
          ))}
        </TextField>
      )}

      {sinFichaPropia ? (
        <Alert severity="info">
          Tu usuario no tiene una ficha de trabajador asociada.
          {isAdmin
            ? " Selecciona un empleado en el listado de arriba para ver sus horas."
            : " Contacta a un administrador para que te asocie una ficha de trabajador."}
        </Alert>
      ) : (
        <Paper sx={{ p: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DateCalendar
              value={mes}
              onMonthChange={(value: Dayjs) => setMes(value)}
              onChange={(value: Dayjs | null) => {
                if (value) {
                  setMes(value);
                }
              }}
              maxDate={nowInSantiago()}
              loading={isLoading}
              slots={{ day: renderDay }}
            />
          </LocalizationProvider>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
            Total del mes: {data?.totalHoras ?? 0} h
          </Typography>
        </Paper>
      )}

      <RegistrarHorasModal
        open={modalOpen}
        trabajadorId={trabajadorId || undefined}
        horasPorFecha={horasPorFecha}
        onClose={() => setModalOpen(false)}
      />
    </Stack>
  );
};
