import { useSearchParams } from "react-router-dom";
import "../PublicViews.css";

// Checkout Pro vuelve con ?status=approved|pending|in_process|rejected. No se
// depende del purchaseStore: se llega acá con la app recargada desde el sitio
// de MP.
const messages = {
  approved: {
    title: "¡Pago confirmado!",
    body: "Recibirás tus tickets en PDF por correo en los próximos minutos.",
  },
  pending: {
    title: "Estamos procesando tu pago",
    body: "Cuando MercadoPago lo confirme, te enviaremos los tickets por correo.",
  },
  rejected: {
    title: "No se pudo completar el pago",
    body: "Puedes intentar de nuevo con otro medio de pago o pedir un código nuevo en el local.",
  },
} as const;

type PaymentResultKey = keyof typeof messages;

const resolveKey = (status: string | null): PaymentResultKey => {
  if (status === "approved") return "approved";
  if (status === "pending" || status === "in_process") return "pending";
  return "rejected";
};

export const PublicPaymentResultView = () => {
  const [searchParams] = useSearchParams();
  const { title, body } = messages[resolveKey(searchParams.get("status"))];
  // MercadoPago manda el id de su transacción en el redirect; se muestra
  // como dato de respaldo para que el cliente pueda citarlo si necesita
  // reclamar (no depende del purchaseStore, así que es lo único disponible).
  const paymentId = searchParams.get("payment_id");

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <section className="publicPanel">
          <h2>{title}</h2>
          <p>{body}</p>
          {paymentId && (
            <p className="publicMuted">N.º de pago (MercadoPago): {paymentId}</p>
          )}
        </section>
      </div>
    </main>
  );
};
