import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../ui/card/Card";
import { usePublicEventsQuery } from "../../../core/api/public.hooks";
import type { PublicEvent } from "../../../core/api/types";
import { publicEventPaths } from "../../../constant/routes";
import "../../../views/public/PublicViews.css";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatDateRange = (event: PublicEvent): string => {
  const startLabel = dateFormatter.format(new Date(event.startsAt));
  const endLabel = dateFormatter.format(new Date(event.endsAt));
  return startLabel === endLabel ? startLabel : `${startLabel} al ${endLabel}`;
};

export const BodyEvents = () => {
  const { data: events = [], isLoading } = usePublicEventsQuery();
  const navigate = useNavigate();

  const cards = useMemo(
    () =>
      events.map((event) => (
        <Card
          key={event.id}
          title={event.title}
          description={event.description}
          dateLabel={formatDateRange(event)}
          ticketsAvailable={event.ticketsAvailable}
          onReserve={() => navigate(publicEventPaths.detail(event.id))}
          imageUrl={event.officialImageUrl}
        />
      )),
    [events, navigate],
  );

  return (
    <div className="publicPageContainer">
      <h4 className="text-6xl">Eventos</h4>
      <p className="publicMuted ">
        Explora los eventos disponibles actualmente en Experencias D'encanto.
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
