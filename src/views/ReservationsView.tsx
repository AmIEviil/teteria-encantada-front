import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GridViewIcon from "@mui/icons-material/GridView";
import { CustomCalendarV2 } from "../components/ui/calendar/CustomCalendarV2";
import {
  useCreateReservationMutation,
  useDeleteReservationMutation,
  useReservationScheduleQuery,
  useReservationsQuery,
  useUpdateReservationScheduleMutation,
  useUpdateReservationMutation,
} from "../core/api/reservations.hooks";
import { FloorPlan } from "../components/teaRoom/FloorPlan/FloorPlan";
import { useLayoutsQuery } from "../core/api/layouts.hooks";
import { useTablesQuery } from "../core/api/tables.hooks";
import type {
  ReservationScheduleDay,
  ReservationStatus,
  RestaurantTable,
} from "../core/api/types";
import {
  buildAllTimeOptions,
  buildAvailableDateKeys,
  buildTimeSlotsForDate,
  normalizeScheduleDays,
  WEEK_DAY_OPTIONS,
} from "../utils/reservationSchedule.utils";
import "./ReservationsView.css";

type ReservationFilterStatus = ReservationStatus | "ALL";

interface GuestInput {
  id: string;
  value: string;
}

const normalizeMesaLabel = (tableLabel?: string | null, tableCode?: string): string => {
  const source = (tableLabel || tableCode || "").trim().toUpperCase();
  const numberMatch = /MESA[_\-\s]?(\d+)/.exec(source)?.[1];

  if (!numberMatch) {
    return source || "MESA";
  }

  return `MESA_${Number.parseInt(numberMatch, 10)}`;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

const TABLE_STATUS_LABEL: Record<RestaurantTable["status"], string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Ocupada",
  RESERVED: "Reservada",
  OUT_OF_SERVICE: "Fuera de servicio",
};

const TODAY_DATE = new Date().toISOString().slice(0, 10);

const parseInputDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const formatDateForInput = (value: Date): string => value.toISOString().slice(0, 10);

const sanitizeInteger = (value: number, min = 1): number => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.round(value));
};

export const ReservationsView = () => {
  const isPhoneViewport = useMediaQuery("(max-width: 680px)");
  const { data: tables = [], isLoading: loadingTables } = useTablesQuery();
  const { data: layouts = [] } = useLayoutsQuery();

  const [tableId, setTableId] = useState("");
  const [date, setDate] = useState(TODAY_DATE);
  const [time, setTime] = useState("18:00");
  const [peopleCount, setPeopleCount] = useState(2);
  const [holderName, setHolderName] = useState("");
  const [notes, setNotes] = useState("");
  const [guestNames, setGuestNames] = useState<GuestInput[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReservationFilterStatus>("ACTIVE");
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const createReservationMutation = useCreateReservationMutation();
  const updateReservationMutation = useUpdateReservationMutation();
  const deleteReservationMutation = useDeleteReservationMutation();
  const { data: reservationSchedule = [], isLoading: loadingReservationSchedule } =
    useReservationScheduleQuery();
  const updateReservationScheduleMutation = useUpdateReservationScheduleMutation();
  const [scheduleDraft, setScheduleDraft] = useState<ReservationScheduleDay[]>([]);
  const [scheduleValidationMessage, setScheduleValidationMessage] = useState<string | null>(null);

  const allTimeOptions = useMemo(() => buildAllTimeOptions(), []);

  useEffect(() => {
    setScheduleDraft(normalizeScheduleDays(reservationSchedule));
  }, [reservationSchedule]);

  const availableDateKeys = useMemo(
    () => buildAvailableDateKeys(scheduleDraft),
    [scheduleDraft],
  );

  const availableTimeSlots = useMemo(
    () => buildTimeSlotsForDate(date, scheduleDraft),
    [date, scheduleDraft],
  );

  useEffect(() => {
    if (availableDateKeys.length === 0) {
      return;
    }

    if (!availableDateKeys.includes(date)) {
      setDate(availableDateKeys[0]);
    }
  }, [availableDateKeys, date]);

  useEffect(() => {
    if (availableTimeSlots.length === 0) {
      if (time) {
        setTime("");
      }
      return;
    }

    if (!availableTimeSlots.includes(time)) {
      setTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, time]);

  const reservationFilters = useMemo(
    () => ({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      startDate: TODAY_DATE,
    }),
    [statusFilter],
  );

  const { data: reservations = [], isLoading: loadingReservations } = useReservationsQuery(
    reservationFilters,
  );

  const isSubmitting =
    createReservationMutation.isPending ||
    updateReservationMutation.isPending ||
    deleteReservationMutation.isPending;

  const activeLayout = useMemo(
    () => layouts.find((layout) => layout.isActive) ?? layouts[0] ?? null,
    [layouts],
  );

  const handleAddGuestInput = () => {
    setGuestNames((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  };

  const handleGuestNameChange = (index: number, value: string) => {
    setGuestNames((prev) =>
      prev.map((guestName, currentIndex) =>
        currentIndex === index ? { ...guestName, value } : guestName,
      ),
    );
  };

  const handleRemoveGuestInput = (index: number) => {
    setGuestNames((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleCreateReservation = async () => {
    if (!tableId || !time) {
      return;
    }

    const normalizedGuests = guestNames
      .map((guest) => guest.value.trim())
      .filter((guestName) => guestName.length > 0);

    await createReservationMutation.mutateAsync({
      tableId,
      reservedFor: `${date}T${time}:00`,
      peopleCount: Math.max(1, Math.round(peopleCount)),
      holderName: holderName.trim() || undefined,
      notes: notes.trim() || undefined,
      guestNames: normalizedGuests.length > 0 ? normalizedGuests : undefined,
    });

    setHolderName("");
    setNotes("");
    setGuestNames([]);
  };

  const handleSelectTableFromLayout = (selectedTableId: string) => {
    setTableId(selectedTableId);
    setIsLayoutModalOpen(false);
  };

  const handlePeopleCountInputChange = (rawValue: string) => {
    if (rawValue.trim() === "") {
      setPeopleCount(1);
      return;
    }

    setPeopleCount(sanitizeInteger(Number(rawValue), 1));
  };

  const handleScheduleDayChange = (
    dayOfWeek: number,
    patch: Partial<ReservationScheduleDay>,
  ) => {
    setScheduleDraft((prev) =>
      prev.map((scheduleDay) => {
        if (scheduleDay.dayOfWeek !== dayOfWeek) {
          return scheduleDay;
        }

        return { ...scheduleDay, ...patch };
      }),
    );
  };

  const handleSaveSchedule = async () => {
    setScheduleValidationMessage(null);

    const invalidDay = scheduleDraft.find((scheduleDay) => {
      if (!scheduleDay.isOpen) {
        return false;
      }

      if (!scheduleDay.opensAt || !scheduleDay.closesAt) {
        return true;
      }

      return scheduleDay.opensAt >= scheduleDay.closesAt;
    });

    if (invalidDay) {
      const dayLabel =
        WEEK_DAY_OPTIONS.find((option) => option.dayOfWeek === invalidDay.dayOfWeek)?.label ??
        "Dia";
      setScheduleValidationMessage(
        `${dayLabel}: el horario de apertura debe ser menor que el de cierre.`,
      );
      return;
    }

    await updateReservationScheduleMutation.mutateAsync({
      days: scheduleDraft.map((scheduleDay) => ({
        dayOfWeek: scheduleDay.dayOfWeek,
        isOpen: scheduleDay.isOpen,
        opensAt: scheduleDay.isOpen ? scheduleDay.opensAt : null,
        closesAt: scheduleDay.isOpen ? scheduleDay.closesAt : null,
      })),
    });

    setIsScheduleModalOpen(false);
  };

  const handleOpenScheduleModal = () => {
    setScheduleDraft(normalizeScheduleDays(reservationSchedule));
    setScheduleValidationMessage(null);
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleValidationMessage(null);
    setIsScheduleModalOpen(false);
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
        <Typography variant="h4" fontWeight={600}>
          Modulo de Reservas
        </Typography>

        <Button variant="outlined" onClick={handleOpenScheduleModal}>
          Configurar horario semanal
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Crear reserva</Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Box className="reservationTableSelectorGroup">
              <TextField
                select
                label="Mesa"
                value={tableId}
                onChange={(event) => setTableId(event.target.value)}
                disabled={loadingTables}
                fullWidth
              >
                <MenuItem value="">Seleccionar mesa</MenuItem>
                {tables.map((table) => (
                  <MenuItem
                    key={table.id}
                    value={table.id}
                    disabled={table.status === "OUT_OF_SERVICE"}
                  >
                    {normalizeMesaLabel(table.label, table.code)} - {TABLE_STATUS_LABEL[table.status]}
                  </MenuItem>
                ))}
              </TextField>

              <Tooltip title="Ver Layout" arrow>
                <span>
                  <IconButton
                    onClick={() => setIsLayoutModalOpen(true)}
                    disabled={loadingTables || tables.length === 0}
                    className="reservationLayoutIconButton"
                    aria-label="Ver Layout"
                  >
                    <GridViewIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <CustomCalendarV2
              label="Dia"
              showLabel={false}
              initialDate={parseInputDate(date) ?? undefined}
              availableDates={availableDateKeys}
              onSave={(value) => setDate(value ? formatDateForInput(value) : "")}
            />

            <TextField
              select
              label="Hora"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              disabled={availableTimeSlots.length === 0}
              fullWidth
            >
              {availableTimeSlots.length === 0 ? (
                <MenuItem value="">Sin horarios disponibles</MenuItem>
              ) : null}
              {availableTimeSlots.map((slot) => (
                <MenuItem key={slot} value={slot}>
                  {slot}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <Box className="reservationPeopleField">
              <Typography
                variant="body2"
                color="text.secondary"
                className="reservationPeopleLabel"
              >
                Cantidad de personas
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  type="button"
                  variant="outlined"
                  className="reservationStepperButton"
                  onClick={() =>
                    setPeopleCount((prevPeopleCount) =>
                      sanitizeInteger(prevPeopleCount - 1, 1),
                    )
                  }
                  aria-label="Reducir cantidad de personas"
                >
                  -
                </Button>

                <TextField
                  type="number"
                  value={sanitizeInteger(peopleCount, 1)}
                  onChange={(event) => handlePeopleCountInputChange(event.target.value)}
                  className="reservationNumberInput"
                  size="small"
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      step: 1,
                      inputMode: "numeric",
                    },
                  }}
                />

                <Button
                  type="button"
                  variant="outlined"
                  className="reservationStepperButton"
                  onClick={() =>
                    setPeopleCount((prevPeopleCount) =>
                      sanitizeInteger(prevPeopleCount + 1, 1),
                    )
                  }
                  aria-label="Aumentar cantidad de personas"
                >
                  +
                </Button>
              </Stack>
            </Box>

            <TextField
              label="Nombre titular"
              value={holderName}
              onChange={(event) => setHolderName(event.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Notas"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={600}>Integrantes de la reserva</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddGuestInput}>
                Agregar integrante
              </Button>
            </Stack>

            {guestNames.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Puedes dejarlo vacio o agregar nombres y apellidos de quienes asistiran.
              </Typography>
            )}

            {guestNames.map((guestName, index) => (
              <Stack key={guestName.id} direction="row" spacing={1} alignItems="center">
                <TextField
                  label={`Integrante ${index + 1}`}
                  value={guestName.value}
                  onChange={(event) => handleGuestNameChange(index, event.target.value)}
                  fullWidth
                />
                <IconButton
                  onClick={() => handleRemoveGuestInput(index)}
                  className="reservationDangerButton"
                  aria-label={`Eliminar integrante ${index + 1}`}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>

          <Box>
            <Button
              variant="contained"
              onClick={handleCreateReservation}
              disabled={!tableId || !time || isSubmitting}
            >
              Guardar reserva
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Dialog
        open={isScheduleModalOpen}
        onClose={handleCloseScheduleModal}
        fullWidth
        maxWidth="md"
        fullScreen={isPhoneViewport}
      >
        <DialogTitle>Horario semanal de reservas</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {loadingReservationSchedule ? (
              <Typography color="text.secondary">Cargando configuracion...</Typography>
            ) : null}

            {!loadingReservationSchedule && scheduleDraft.length > 0 ? (
              <Stack spacing={1}>
                {scheduleDraft.map((scheduleDay) => {
                  const dayLabel =
                    WEEK_DAY_OPTIONS.find((option) => option.dayOfWeek === scheduleDay.dayOfWeek)
                      ?.label ?? "Dia";

                  return (
                    <Box key={scheduleDay.dayOfWeek} className="reservationScheduleRow">
                      <Typography className="reservationScheduleDayLabel">{dayLabel}</Typography>

                      <TextField
                        select
                        label="Estado"
                        value={scheduleDay.isOpen ? "OPEN" : "CLOSED"}
                        onChange={(event) => {
                          const isOpen = event.target.value === "OPEN";
                          handleScheduleDayChange(scheduleDay.dayOfWeek, {
                            isOpen,
                            opensAt: isOpen ? scheduleDay.opensAt ?? "10:00" : null,
                            closesAt: isOpen ? scheduleDay.closesAt ?? "23:30" : null,
                          });
                        }}
                        size="small"
                        sx={{ minWidth: 150 }}
                      >
                        <MenuItem value="OPEN">Abierto</MenuItem>
                        <MenuItem value="CLOSED">Cerrado</MenuItem>
                      </TextField>

                      <TextField
                        select
                        label="Desde"
                        value={scheduleDay.opensAt ?? ""}
                        onChange={(event) =>
                          handleScheduleDayChange(scheduleDay.dayOfWeek, {
                            opensAt: event.target.value,
                          })
                        }
                        size="small"
                        disabled={!scheduleDay.isOpen}
                        sx={{ minWidth: 130 }}
                      >
                        {allTimeOptions.map((option) => (
                          <MenuItem key={`open-${scheduleDay.dayOfWeek}-${option}`} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        select
                        label="Hasta"
                        value={scheduleDay.closesAt ?? ""}
                        onChange={(event) =>
                          handleScheduleDayChange(scheduleDay.dayOfWeek, {
                            closesAt: event.target.value,
                          })
                        }
                        size="small"
                        disabled={!scheduleDay.isOpen}
                        sx={{ minWidth: 130 }}
                      >
                        {allTimeOptions.map((option) => (
                          <MenuItem key={`close-${scheduleDay.dayOfWeek}-${option}`} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  );
                })}

                {scheduleValidationMessage ? (
                  <Alert severity="error">{scheduleValidationMessage}</Alert>
                ) : null}

                <Divider />

                <Typography variant="body2" color="text.secondary">
                  Los dias cerrados no apareceran como seleccionables al crear reservas.
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleModal}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleSaveSchedule();
            }}
            disabled={updateReservationScheduleMutation.isPending || loadingReservationSchedule}
          >
            {updateReservationScheduleMutation.isPending ? "Guardando..." : "Guardar horario"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        fullWidth
        maxWidth="xl"
        fullScreen={isPhoneViewport}
        slotProps={{
          paper: {
            className: "reservationLayoutDialogPaper",
          },
        }}
      >
        <DialogTitle className="reservationLayoutDialogTitle">
          Layout actual{activeLayout?.name ? `: ${activeLayout.name}` : ""}
        </DialogTitle>
        <DialogContent className="reservationLayoutDialogContent">
          {tables.length === 0 && (
            <Typography color="text.secondary">
              No hay mesas disponibles para mostrar.
            </Typography>
          )}

          {tables.length > 0 && (
            <Box className="reservationLayoutFloorPlan">
              <FloorPlan
                selectedTableId={tableId || undefined}
                onSelectTable={handleSelectTableFromLayout}
                isWideMode
                previewOnly
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions className="reservationLayoutDialogActions">
          <Button onClick={() => setIsLayoutModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
            <Typography variant="h6">Reservas registradas</Typography>

            <TextField
              select
              label="Filtrar estado"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReservationFilterStatus)
              }
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="ALL">Todas</MenuItem>
              <MenuItem value="ACTIVE">Activas</MenuItem>
              <MenuItem value="COMPLETED">Completadas</MenuItem>
              <MenuItem value="CANCELLED">Canceladas</MenuItem>
            </TextField>
          </Stack>

          {loadingReservations && (
            <Typography color="text.secondary">Cargando reservas...</Typography>
          )}

          {!loadingReservations && reservations.length === 0 && (
            <Typography color="text.secondary">
              No hay reservas para el filtro seleccionado.
            </Typography>
          )}

          <Stack spacing={1}>
            {reservations.map((reservation) => (
              <Paper key={reservation.id} variant="outlined" sx={{ p: 1.25 }}>
                <Stack spacing={0.6}>
                  <Typography fontWeight={600}>
                    {normalizeMesaLabel(
                      reservation.table?.label,
                      reservation.table?.code,
                    )}
                  </Typography>
                  <Typography variant="body2">
                    Fecha y hora: {formatDateTime(reservation.reservedFor)}
                  </Typography>
                  <Typography variant="body2">
                    Estado: {STATUS_LABEL[reservation.status]}
                  </Typography>
                  <Typography variant="body2">
                    Personas: {reservation.peopleCount}
                  </Typography>
                  <Typography variant="body2">
                    Titular: {reservation.holderName || "-"}
                  </Typography>
                  <Typography variant="body2">
                    Integrantes: {reservation.guestNames.length > 0 ? reservation.guestNames.join(", ") : "-"}
                  </Typography>
                  <Typography variant="body2">Notas: {reservation.notes || "-"}</Typography>

                  <Stack direction="row" spacing={1} className="reservationActionsRow">
                    {reservation.status === "ACTIVE" && (
                      <>
                        <Button
                          variant="outlined"
                          onClick={() =>
                            updateReservationMutation.mutate({
                              id: reservation.id,
                              payload: { status: "COMPLETED" },
                            })
                          }
                          disabled={isSubmitting}
                        >
                          Marcar completada
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            updateReservationMutation.mutate({
                              id: reservation.id,
                              payload: { status: "CANCELLED" },
                            })
                          }
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}

                    <Button
                      variant="text"
                      color="error"
                      onClick={() => deleteReservationMutation.mutate(reservation.id)}
                      disabled={isSubmitting}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};
