import { useSearchParams } from "react-router-dom";
import "../PublicViews.css";

// Checkout Pro vuelve con ?status=approved|pending|rejected. No se depende del
// purchaseStore: se llega acá con la app recargada desde el sitio de MP.
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

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <section className="publicPanel">
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      </div>
    </main>
  );
};
