import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PublicHeader } from "../../../components/public/PublicHeader";
import { usePublicEventDetailQuery } from "../../../core/api/public.hooks";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import "../PublicViews.css";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export const PublicEventSessionView = () => {
  const { id = "", sessionId = "" } = useParams();
  const navigate = useNavigate();
  const event = usePurchaseStore((s) => s.event);
  const session = usePurchaseStore((s) => s.session);
  const setContext = usePurchaseStore((s) => s.setContext);

  // Hard-refresh fallback: store vacío → refetch y rehidratar.
  const needsFetch = !event || event.id !== id || session?.id !== sessionId;
  const { data: fetched } = usePublicEventDetailQuery(id, needsFetch);

  useEffect(() => {
    if (needsFetch && fetched) {
      const found = fetched.sessions.find((s) => s.id === sessionId);
      if (found) setContext(fetched, found);
      else navigate(publicEventPaths.detail(id), { replace: true });
    }
  }, [needsFetch, fetched, sessionId, id, setContext, navigate]);

  const activeEvent = event && event.id === id ? event : fetched ?? null;
  const activeSession =
    session && session.id === sessionId
      ? session
      : activeEvent?.sessions.find((s) => s.id === sessionId) ?? null;

  if (!activeEvent || !activeSession) {
    return (
      <main className="publicPage">
        <div className="publicPageContainer">
          <PublicHeader />
          <p className="publicMuted">Cargando jornada...</p>
        </div>
      </main>
    );
  }

  const scheduleLabel = activeSession.endTime
    ? `${activeSession.startTime} - ${activeSession.endTime}`
    : activeSession.startTime;

  const availableTypeIds = new Set(
    activeSession.ticketTypes.filter((t) => t.available).map((t) => t.ticketTypeId),
  );
  const types = activeEvent.ticketTypes.filter((t) => availableTypeIds.has(t.id));

  const goToReserva = () => {
    setContext(activeEvent, activeSession);
    navigate(publicEventPaths.reserva(activeEvent.id));
  };

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <PublicHeader />

        <header className="publicEventHero">
          <h2>{activeEvent.title}</h2>
          <p className="publicMuted" style={{ textTransform: "capitalize" }}>
            {dateFormatter.format(new Date(`${activeSession.date}T00:00:00`))}
          </p>
          <p className="publicMuted">
            {scheduleLabel} · <span>{activeSession.name ?? "Jornada"}</span>
          </p>
        </header>

        <section className="publicPanel">
          <h3>Tipos de ticket</h3>
          <div className="publicMenuGrid">
            {types.map((t) => (
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
            disabled={types.length === 0}
            onClick={goToReserva}
          >
            Reservar ahora
          </button>
        </section>
      </div>
    </main>
  );
};
