import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PublicHeader } from "../../../components/public/PublicHeader";
import { usePublicPurchaseMutation } from "../../../core/api/public.hooks";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import type { PublicPurchaseResult } from "../../../core/api/publicEvents.types";
import "../PublicViews.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sessionDateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const PublicEventPagoView = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const event = usePurchaseStore((s) => s.event);
  const session = usePurchaseStore((s) => s.session);
  const items = usePurchaseStore((s) => s.items);
  const total = usePurchaseStore((s) => s.total());
  const reset = usePurchaseStore((s) => s.reset);
  const openSnackbar = useSnackBarResponseStore((s) => s.openSnackbar);
  const purchase = usePublicPurchaseMutation(id);

  const [email, setEmail] = useState("");
  const [result, setResult] = useState<PublicPurchaseResult | null>(null);

  // ponytail: carrito en memoria; refresh duro pierde contexto → volver al detalle.
  const hasValidContext = !!event && event.id === id;

  useEffect(() => {
    if (!hasValidContext && !result) {
      navigate(publicEventPaths.detail(id), { replace: true });
    }
  }, [hasValidContext, result, id, navigate]);

  if (!hasValidContext && !result) {
    return null;
  }

  if (result) {
    return (
      <main className="publicPage">
        <div className="publicPageContainer">
          <PublicHeader />
          <section className="publicPanel">
            <h2>¡Reserva confirmada!</h2>
            <p className="publicMuted">
              {result.tickets.length} ticket(s) para {result.eventTitle}.
            </p>
            <p className="publicMuted">
              Tu boleta llegará a {result.buyerEmail}. {/* ponytail: envío real pendiente */}
            </p>
            <p className="publicMenuPrice">Total {formatMoneyNumber(result.total)}</p>
            <button
              type="button"
              className="publicJornadaButton"
              onClick={() => navigate("/publico/eventos")}
            >
              Volver a eventos
            </button>
          </section>
        </div>
      </main>
    );
  }

  const scheduleLabel = session
    ? `${sessionDateFormatter.format(new Date(`${session.date}T00:00:00`))} · ${session.startTime}${session.name ? ` · ${session.name}` : ""}`
    : event
      ? new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(new Date(event.startsAt))
      : "";

  const attendanceDate = event
    ? new Date(event.startsAt).toISOString().slice(0, 10)
    : undefined;

  const canPay = EMAIL_RE.test(email) && items.length > 0 && !purchase.isPending;

  const handlePay = () => {
    if (!canPay) return;
    purchase.mutate(
      {
        buyerEmail: email,
        items: items.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          sessionId: session?.id,
          attendanceDate: session ? undefined : attendanceDate,
          attendeeFirstName: item.attendeeFirstName,
          attendeeLastName: item.attendeeLastName,
          menuSelection: item.menuSelection,
        })),
      },
      {
        onSuccess: (data) => {
          reset();
          setResult(data);
        },
        onError: (error) => {
          const err = error as { response?: { data?: { message?: string } } };
          openSnackbar(err.response?.data?.message ?? "No se pudo completar la reserva", "error");
        },
      },
    );
  };

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <PublicHeader />

        <header className="publicEventHero">
          <h2>Pago</h2>
          <p className="publicMuted">{event?.title}</p>
          <p className="publicMuted">{scheduleLabel}</p>
        </header>

        <section className="publicPanel">
          <ul className="publicCartList">
            {items.map((item) => (
              <li key={item.id} className="publicCartRow">
                <span>
                  {item.attendeeFirstName} {item.attendeeLastName} — {item.ticketTypeName}
                </span>
                <span>{formatMoneyNumber(item.unitPrice + item.menuExtraPrice)}</span>
              </li>
            ))}
          </ul>
          <p className="publicMenuPrice">Total {formatMoneyNumber(total)}</p>
        </section>

        <section className="publicPanel">
          <label className="input-title" htmlFor="buyer-email">
            Email para recibir la boleta *
          </label>
          <input
            id="buyer-email"
            className="publicField"
            type="email"
            value={email}
            placeholder="tucorreo@ejemplo.cl"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="publicActionsRow">
            <button
              type="button"
              className="publicJornadaButton"
              disabled={!canPay}
              onClick={handlePay}
            >
              PAGAR
            </button>
          </div>
          {/* ponytail: pasarela de pago real pendiente; hoy PAGAR crea los tickets. */}
        </section>
      </div>
    </main>
  );
};
