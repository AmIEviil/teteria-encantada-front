import type { PublicEventDetailSession } from "../../../../core/api/publicEvents.types";
import "../../../../views/public/PublicViews.css";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

interface JornadaCardProps {
  session: PublicEventDetailSession;
  onReserve: (session: PublicEventDetailSession) => void;
}

export const JornadaCard = ({ session, onReserve }: JornadaCardProps) => {
  const scheduleLabel = session.endTime
    ? `${session.startTime} - ${session.endTime}`
    : session.startTime;
  const activity = session.name ?? scheduleLabel;

  return (
    <article className="publicJornadaCard">
      <div className="publicJornadaInfo">
        <p className="publicJornadaDate">
          {dateFormatter.format(new Date(`${session.date}T00:00:00`))}
        </p>
        <hr className="publicJornadaDivider" />
        <p className="publicJornadaSchedule">
          <span>{scheduleLabel}</span> · <span>{activity}</span>
        </p>
      </div>
      <button
        type="button"
        className="publicJornadaButton"
        disabled={!session.available}
        onClick={() => onReserve(session)}
      >
        {session.available ? "RESERVAR" : "NO DISPONIBLE"}
      </button>
    </article>
  );
};
