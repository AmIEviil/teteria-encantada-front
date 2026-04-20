import { useEffect, useMemo, useState } from "react";
import { CustomCalendarV2 } from "../components/ui/calendar/CustomCalendarV2";
import { PublicHeader } from "../components/public/PublicHeader";
import {
  usePublicCreateReservationMutation,
  usePublicReservationScheduleQuery,
  usePublicReservationsQuery,
  usePublicTablesQuery,
} from "../core/api/public.hooks";
import type { ReservationStatus } from "../core/api/types";
import {
  buildAvailableDateKeys,
  buildTimeSlotsForDate,
  isValidLookupInput,
  normalizePhoneValue,
  resolveLookupFilter,
} from "../utils/reservationSchedule.utils";
import "./PublicViews.css";

type StatusFilter = ReservationStatus | "ALL";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
};

const STATUS_CLASS_NAME: Record<ReservationStatus, string> = {
  ACTIVE: "publicStatus publicStatus--active",
  CANCELLED: "publicStatus publicStatus--cancelled",
  COMPLETED: "publicStatus publicStatus--completed",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const normalizeTableName = (label: string | null, code: string): string => {
  const source = (label || code || "").trim();
  return source.length > 0 ? source : "Mesa";
};

const formatInputDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const sanitizeInteger = (value: number, min = 1): number => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.round(value));
};

const now = new Date();
const initialDate = formatInputDate(now);

export const PublicReservationsView = () => {
  const { data: tables = [] } = usePublicTablesQuery();
  const { data: reservationSchedule = [] } = usePublicReservationScheduleQuery();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [lookupInput, setLookupInput] = useState("");
  const [tableId, setTableId] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [holderName, setHolderName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );

  const createReservationMutation = usePublicCreateReservationMutation();

  const availableDateKeys = useMemo(
    () => buildAvailableDateKeys(reservationSchedule),
    [reservationSchedule],
  );

  const availableTimeSlots = useMemo(
    () => buildTimeSlotsForDate(date, reservationSchedule),
    [date, reservationSchedule],
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

  const normalizedLookupInput = lookupInput.trim();
  const canQueryReservations = isValidLookupInput(normalizedLookupInput);

  const reservationFilters = useMemo(
    () => ({
      ...resolveLookupFilter(normalizedLookupInput),
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
    [normalizedLookupInput, statusFilter],
  );

  const { data: reservations = [], isLoading: loadingReservations } = usePublicReservationsQuery(
    reservationFilters,
    canQueryReservations,
  );

  const normalizedEmail = email.trim().toLowerCase();
  const canSubmit =
    Boolean(tableId) &&
    Boolean(date) &&
    Boolean(time) &&
    peopleCount > 0 &&
    EMAIL_PATTERN.test(normalizedEmail) &&
    availableTimeSlots.length > 0;

  const handleSubmit = async () => {
    setFeedback(null);

    if (!canSubmit) {
      setFeedback({
        type: "error",
        text: "Completa los datos requeridos y verifica correo/horario disponible.",
      });
      return;
    }

    const holder = holderName.trim();
    if (holder.length > 0 && holder.length < 2) {
      setFeedback({ type: "error", text: "El nombre titular debe tener al menos 2 caracteres." });
      return;
    }

    const reservationDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(reservationDate.getTime())) {
      setFeedback({ type: "error", text: "La fecha u hora no es valida." });
      return;
    }

    try {
      await createReservationMutation.mutateAsync({
        tableId,
        reservedFor: reservationDate.toISOString(),
        peopleCount: Math.max(1, Math.round(peopleCount)),
        holderName: holder || undefined,
        email: normalizedEmail || undefined,
        phone: normalizePhoneValue(phone) || undefined,
        notes: notes.trim() || undefined,
      });

      setHolderName("");
      setPhone("");
      setNotes("");
      setFeedback({ type: "success", text: "Reserva creada correctamente." });
    } catch {
      setFeedback({
        type: "error",
        text: "No se pudo crear la reserva. Verifica disponibilidad de mesa e intenta nuevamente.",
      });
    }
  };

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <PublicHeader />

        <section className="publicGridTwo">
          <article className="publicPanel">
            <h2>Generar reserva</h2>
            <p className="publicMuted">
              Completa el formulario y tu reserva quedara registrada en el sistema.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <div className="publicFormGrid">
                <label>
                  <span>Mesa</span>
                  <select
                    className="publicSelect"
                    value={tableId}
                    onChange={(event) => setTableId(event.target.value)}
                    required
                  >
                    <option value="">Selecciona una mesa</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {normalizeTableName(table.label, table.code)} | Capacidad {table.capacity}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Personas</span>
                  <div className="publicStepperGroup">
                    <button
                      type="button"
                      className="publicStepperButton"
                      onClick={() =>
                        setPeopleCount((previousPeopleCount) =>
                          sanitizeInteger(previousPeopleCount - 1, 1),
                        )
                      }
                      aria-label="Reducir cantidad de personas"
                    >
                      -
                    </button>

                    <input
                      className="publicField publicStepperInput"
                      type="number"
                      min={1}
                      step={1}
                      value={sanitizeInteger(peopleCount, 1)}
                      onChange={(event) =>
                        setPeopleCount(sanitizeInteger(Number(event.target.value || 1), 1))
                      }
                      required
                    />

                    <button
                      type="button"
                      className="publicStepperButton"
                      onClick={() =>
                        setPeopleCount((previousPeopleCount) =>
                          sanitizeInteger(previousPeopleCount + 1, 1),
                        )
                      }
                      aria-label="Aumentar cantidad de personas"
                    >
                      +
                    </button>
                  </div>
                </label>

                <label>
                  <span>Fecha</span>
                  <CustomCalendarV2
                    showLabel={false}
                    initialDate={parseInputDate(date) ?? undefined}
                    availableDates={availableDateKeys}
                    onSave={(value) => setDate(value ? formatInputDate(value) : "")}
                  />
                </label>

                <label>
                  <span>Hora</span>
                  <select
                    className="publicSelect"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    required
                    disabled={availableTimeSlots.length === 0}
                  >
                    <option value="">
                      {availableTimeSlots.length === 0
                        ? "Sin horarios disponibles"
                        : "Selecciona una hora"}
                    </option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Nombre titular</span>
                <input
                  className="publicField"
                  type="text"
                  value={holderName}
                  onChange={(event) => setHolderName(event.target.value)}
                  maxLength={120}
                  placeholder="Ej: Maria Perez"
                />
              </label>

              <label>
                <span>Correo asociado</span>
                <input
                  className="publicField"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={160}
                  placeholder="Ej: cliente@correo.com"
                  required
                />
              </label>

              <label>
                <span>Telefono asociado (opcional)</span>
                <input
                  className="publicField"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={25}
                  placeholder="Ej: +56912345678"
                />
              </label>

              <label>
                <span>Notas</span>
                <textarea
                  className="publicTextarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={600}
                  placeholder="Ej: Celebracion de cumpleanos"
                />
              </label>

              <div className="publicFormActions">
                <button className="publicButton" type="submit" disabled={createReservationMutation.isPending}>
                  {createReservationMutation.isPending ? "Guardando..." : "Reservar"}
                </button>

                {feedback ? (
                  <p
                    className={`publicMessage ${
                      feedback.type === "error"
                        ? "publicMessage--error"
                        : "publicMessage--success"
                    }`}
                  >
                    {feedback.text}
                  </p>
                ) : null}
              </div>
            </form>
          </article>

          <article className="publicPanel">
            <h2>Reservas realizadas</h2>

            <label>
              <span>Buscar por correo o telefono</span>
              <input
                className="publicField"
                type="text"
                value={lookupInput}
                onChange={(event) => setLookupInput(event.target.value)}
                placeholder="Ej: cliente@correo.com o +56912345678"
              />
            </label>

            <label>
              <span>Filtrar por estado</span>
              <select
                className="publicSelect"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="ALL">Todas</option>
                <option value="ACTIVE">Activas</option>
                <option value="COMPLETED">Completadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
            </label>

            <div className="publicReservationsList">
              {canQueryReservations ? null : (
                <p className="publicMuted">
                  Ingresa un correo o telefono valido para consultar tus reservas.
                </p>
              )}

              {canQueryReservations && loadingReservations ? (
                <p className="publicMuted">Cargando reservas...</p>
              ) : null}

              {canQueryReservations && !loadingReservations && reservations.length === 0 ? (
                <p className="publicMuted">Aun no hay reservas para mostrar.</p>
              ) : null}

              {canQueryReservations &&
                reservations.map((reservation) => (
                  <article className="publicReservationCard" key={reservation.id}>
                    <div>
                      <strong>{normalizeTableName(reservation.tableLabel, reservation.tableCode)}</strong>
                      <span className={STATUS_CLASS_NAME[reservation.status]}>
                        {STATUS_LABEL[reservation.status]}
                      </span>
                    </div>
                    <p className="publicReservationMeta">
                      Fecha: {formatDateTime(reservation.reservedFor)} | Personas: {reservation.peopleCount}
                    </p>
                    <p className="publicReservationMeta">
                      Titular: {reservation.holderName?.trim() || "No informado"}
                    </p>
                    <p className="publicReservationMeta">
                      Contacto: {reservation.email || reservation.phone || "No informado"}
                    </p>
                    {reservation.notes ? (
                      <p className="publicReservationMeta">Notas: {reservation.notes}</p>
                    ) : null}
                  </article>
                ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
};
