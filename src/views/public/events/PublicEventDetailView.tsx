import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { JornadaCard } from "../../../components/public/events/JornadaCard/JornadaCard";
import { usePublicEventDetailQuery } from "../../../core/api/public.hooks";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import type { PublicEventDetailSession } from "../../../core/api/publicEvents.types";
import "../PublicViews.css";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** "2026-07-11" -> "11 jul 2026", sin que el parser lo corra a UTC. */
const formatDateKey = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
};

export const PublicEventDetailView = () => {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get("fecha");
  const navigate = useNavigate();
  const setContext = usePurchaseStore((s) => s.setContext);
  const { data: event, isLoading } = usePublicEventDetailQuery(id);

  if (isLoading) {
    return (
      <main className="publicPage">
        <div className="publicPageContainer">
          <p className="publicMuted">Cargando evento...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="publicPage">
        <div className="publicPageContainer">
          <p className="publicMuted">Evento no encontrado.</p>
        </div>
      </main>
    );
  }

  const sessions = selectedDate
    ? event.sessions.filter((session) => session.date === selectedDate)
    : event.sessions;

  const goToSession = (session: PublicEventDetailSession) => {
    setContext(event, session);
    navigate(publicEventPaths.session(event.id, session.id));
  };

  const goToReservaNoSession = () => {
    setContext(event, null);
    navigate(publicEventPaths.reserva(event.id));
  };

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <section className="publicEventHero">
          {event.officialImageUrl && (
            <img
              className="publicEventHeroImage"
              src={event.officialImageUrl}
              alt={event.title}
            />
          )}
          <h2 className="text-4xl">{event.title}</h2>
          {event.description && (
            <p className="publicMuted">{event.description}</p>
          )}
          <p className="publicMuted">
            {dateFormatter.format(new Date(event.startsAt))} -
            {dateFormatter.format(new Date(event.endsAt))}
          </p>
        </section>

        {event.hasSessions ? (
          <section className="publicPanel">
            <h3 className="text-3xl">Selecciona una jornada</h3>
            {selectedDate && (
              <div className="publicSessionFilter">
                <p className="publicMuted">
                  Jornadas del {formatDateKey(selectedDate)}
                </p>
                <button
                  type="button"
                  className="publicJornadaButton"
                  onClick={() => navigate(publicEventPaths.detail(event.id))}
                >
                  Ver todas las jornadas
                </button>
              </div>
            )}
            {sessions.length === 0 ? (
              <p className="publicMuted">
                Este evento no tiene jornadas para ese día.
              </p>
            ) : (
              <div className="publicJornadaList">
                {sessions.map((session) => (
                  <JornadaCard
                    key={session.id}
                    session={session}
                    onReserve={goToSession}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="publicPanel">
            <h3 className="text-3xl">Tipos de ticket</h3>
            <div className="publicMenuGrid">
              {event.ticketTypes.map((t) => (
                <article className="publicMenuCard" key={t.id}>
                  <h4 className="publicMenuName">{t.name}</h4>
                  {t.includesDetails && (
                    <p className="publicMenuDescription">{t.includesDetails}</p>
                  )}
                  <p className="publicMenuPrice">
                    {formatMoneyNumber(t.price)}
                  </p>
                </article>
              ))}
            </div>
            <div className="flex justify-center mt-4 gap-4">
              <button
                type="button"
                className="publicJornadaButton"
                onClick={() => navigate(publicEventPaths.detail(event.id))}
              >
                Volver
              </button>
              <button
                type="button"
                className="publicJornadaButton"
                disabled={event.ticketTypes.every((t) => !t.available)}
                onClick={goToReservaNoSession}
              >
                Reservar ahora
              </button>
              {event.ticketTypes.every((t) => !t.available) && (
                <p className="publicMuted">Sin tickets disponibles</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
