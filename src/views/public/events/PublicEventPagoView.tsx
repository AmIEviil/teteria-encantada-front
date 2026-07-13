import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CardPayment } from "@mercadopago/sdk-react";
import { PublicHeader } from "../../../components/public/PublicHeader";
import { usePayEventMutation } from "../../../core/api/payments.hooks";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import type { PublicPurchaseResult } from "../../../core/api/publicEvents.types";
import type { PayEventResult } from "../../../core/api/payments.types";
import "../PublicViews.css";

// Forma parcial del formData que emite el Card Payment Brick (solo los campos
// que consumimos); el SDK no exporta un tipo público para el callback.
interface CardPaymentFormData {
  token: string;
  installments: number;
  payment_method_id: string;
  issuer_id?: string | number;
  payer: { email?: string };
}

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
  const pay = usePayEventMutation(id);

  const [result, setResult] = useState<PublicPurchaseResult | null>(null);

  // carrito en memoria; refresh duro pierde contexto → volver al detalle.
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
            <p className="publicMuted">Tu boleta llegará a {result.buyerEmail}.</p>
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

  const handleSubmit = async (formData: CardPaymentFormData) => {
    const buyerEmail = formData.payer.email;
    if (!buyerEmail) {
      openSnackbar("Falta el correo del comprador.", "error");
      // El Brick requiere que el promise se rechace para resetear y permitir reintentar.
      throw new Error("Falta el correo del comprador.");
    }

    let res: PayEventResult;
    try {
      res = await pay.mutateAsync({
        buyerEmail,
        items: items.map((item) => ({
          ticketTypeId: item.ticketTypeId,
          sessionId: session?.id,
          attendanceDate: session ? undefined : attendanceDate,
          attendeeFirstName: item.attendeeFirstName,
          attendeeLastName: item.attendeeLastName,
          menuSelection: item.menuSelection,
        })),
        payment: {
          token: formData.token,
          installments: formData.installments,
          paymentMethodId: formData.payment_method_id,
          issuerId: formData.issuer_id ? String(formData.issuer_id) : undefined,
        },
      });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      openSnackbar(err.response?.data?.message ?? "No se pudo completar el pago", "error");
      // Re-lanzamos para que el Brick se resetee y el usuario pueda reintentar.
      throw error;
    }

    if (res.status === "approved" && res.purchase) {
      reset();
      setResult(res.purchase);
      return;
    }

    if (res.status === "approved" && !res.purchase) {
      // El cobro se realizó pero no llegó el detalle de la compra: no reintentar.
      openSnackbar(
        "Tu pago fue procesado. Si no recibes tus tickets por correo, contacta a soporte.",
        "info",
      );
      return;
    }

    if (res.status === "pending") {
      // Pago en proceso: no reintentar para evitar un doble cobro.
      openSnackbar("Tu pago está en proceso; te avisaremos por correo.", "info");
      return;
    }

    openSnackbar("El pago fue rechazado. Intenta con otro medio.", "error");
    // El Brick requiere que el promise se rechace para resetear y permitir reintentar.
    throw new Error("El pago fue rechazado.");
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
          <CardPayment initialization={{ amount: total }} onSubmit={handleSubmit} />
        </section>
      </div>
    </main>
  );
};
