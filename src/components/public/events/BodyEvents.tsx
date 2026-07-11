import { useMemo } from "react";
import { Card } from "../../ui/card/Card";
import { usePublicEventsQuery } from "../../../core/api/public.hooks";
import type { PublicEvent } from "../../../core/api/types";
import "../../../views/public/PublicViews.css";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  minute: "2-digit",
});

const formatDateRange = (event: PublicEvent): string => {
  const startLabel = dateFormatter.format(new Date(event.startsAt));
  const endLabel = dateFormatter.format(new Date(event.endsAt));
  return startLabel === endLabel ? startLabel : `${startLabel} al ${endLabel}`;
};

const formatSchedule = (event: PublicEvent): string => {
  if (event.schedules.length > 0) {
    return event.schedules
      .map((s) => (s.endTime ? `${s.startTime} - ${s.endTime}` : s.startTime))
      .join(" · ");
  }
  // ponytail: sin jornadas, usamos el horario del rango startsAt/endsAt
  const start = timeFormatter.format(new Date(event.startsAt));
  const end = timeFormatter.format(new Date(event.endsAt));
  return `${start} - ${end}`;
};

export const BodyEvents = () => {
  const { data: events = [], isLoading } = usePublicEventsQuery();

  const cards = useMemo(
    () =>
      events.map((event) => (
        <Card
          key={event.id}
          title={event.title}
          description={event.description}
          dateLabel={formatDateRange(event)}
          scheduleLabel={formatSchedule(event)}
          ticketsAvailable={event.ticketsAvailable}
        />
      )),
    [events],
  );

  return (
    <div className="publicPageContainer">
      <h2>Eventos</h2>
      <p className="publicMuted">
        Explora los eventos disponibles actualmente en Teteria.
      </p>
      {isLoading ? (
        <p className="publicMuted">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <p className="publicMuted">No hay eventos disponibles por ahora.</p>
      ) : (
        <div className="publicMenuGrid">{cards}</div>
      )}
    </div>
  );
};
