import { useNavigate, useParams } from "react-router-dom";
import { PublicHeader } from "../../../components/public/PublicHeader";
import { JornadaCard } from "../../../components/public/events/JornadaCard/JornadaCard";
import { usePublicEventDetailQuery } from "../../../core/api/public.hooks";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import type { PublicEventDetailSession } from "../../../core/api/publicEvents.types";
import "../PublicViews.css";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const PublicEventDetailView = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const setContext = usePurchaseStore((s) => s.setContext);
  const { data: event, isLoading } = usePublicEventDetailQuery(id);

  if (isLoading) {
    return (
      <main className="publicPage">
        <div className="publicPageContainer">
          <PublicHeader />
          <p className="publicMuted">Cargando evento...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="publicPage">
        <div className="publicPageContainer">
          <PublicHeader />
          <p className="publicMuted">Evento no encontrado.</p>
        </div>
      </main>
    );
  }

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
        <PublicHeader />

        <section className="publicEventHero">
          {event.officialImageUrl && (
            <img
              className="publicEventHeroImage"
              src={event.officialImageUrl}
              alt={event.title}
            />
          )}
          <h2>{event.title}</h2>
          {event.description && <p className="publicMuted">{event.description}</p>}
          <p className="publicMuted">
            {dateFormatter.format(new Date(event.startsAt))}
          </p>
        </section>

        {event.hasSessions ? (
          <section className="publicPanel">
            <h3>Selecciona una jornada</h3>
            <div className="publicJornadaList">
              {event.sessions.map((session) => (
                <JornadaCard
                  key={session.id}
                  session={session}
                  onReserve={goToSession}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="publicPanel">
            <h3>Tipos de ticket</h3>
            <div className="publicMenuGrid">
              {event.ticketTypes.map((t) => (
                <article className="publicMenuCard" key={t.id}>
                  <h4 className="publicMenuName">{t.name}</h4>
                  {t.includesDetails && (
                    <p className="publicMenuDescription">{t.includesDetails}</p>
                  )}
                  <p className="publicMenuPrice">{formatMoneyNumber(t.price)}</p>
                </article>
              ))}
            </div>
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
          </section>
        )}
      </div>
    </main>
  );
};
