import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PublicHeader } from "../../../components/public/PublicHeader";
import { AttendeeForm } from "../../../components/public/events/AttendeeForm/AttendeeForm";
import {
  buildCartItem,
  isAttendeeDraftValid,
  type AttendeeDraft,
} from "../../../components/public/events/AttendeeForm/attendee.utils";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import "../PublicViews.css";

const newDraft = (ticketTypeId: string): AttendeeDraft => ({
  id: crypto.randomUUID(),
  firstName: "",
  lastName: "",
  ticketTypeId,
  menuByGroup: {},
});

export const PublicEventReservaView = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const event = usePurchaseStore((s) => s.event);
  const session = usePurchaseStore((s) => s.session);
  const items = usePurchaseStore((s) => s.items);
  const addItems = usePurchaseStore((s) => s.addItems);
  const removeItem = usePurchaseStore((s) => s.removeItem);
  const openSnackbar = useSnackBarResponseStore((s) => s.openSnackbar);

  // ponytail: carrito en memoria; refresh duro pierde contexto → volver al detalle.
  const hasValidContext = !!event && event.id === id;

  const availableTypes = hasValidContext
    ? session
      ? event!.ticketTypes.filter((t) =>
          session.ticketTypes.some((st) => st.ticketTypeId === t.id && st.available),
        )
      : event!.ticketTypes.filter((t) => t.available)
    : [];

  const [drafts, setDrafts] = useState<AttendeeDraft[]>(() => [
    newDraft(availableTypes[0]?.id ?? ""),
  ]);

  useEffect(() => {
    if (!hasValidContext) {
      navigate(publicEventPaths.detail(id), { replace: true });
    }
  }, [hasValidContext, id, navigate]);

  if (!hasValidContext) {
    return null;
  }

  const updateDraft = (next: AttendeeDraft) =>
    setDrafts((prev) => prev.map((d) => (d.id === next.id ? next : d)));

  const addPerson = () =>
    setDrafts((prev) => [...prev, newDraft(availableTypes[0]?.id ?? "")]);

  const removeDraft = (draftId: string) =>
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));

  const addToCart = () => {
    const typeOf = (tid: string) => availableTypes.find((t) => t.id === tid);
    const allValid = drafts.every((d) => isAttendeeDraftValid(d, typeOf(d.ticketTypeId)));
    if (!allValid) {
      openSnackbar("Completa nombre, apellido y menú de cada persona", "error");
      return;
    }
    addItems(drafts.map((d) => buildCartItem(d, typeOf(d.ticketTypeId)!)));
    setDrafts([newDraft(availableTypes[0]?.id ?? "")]);
    openSnackbar("Agregado al carrito", "success");
  };

  const scheduleLabel = session
    ? `${session.date} · ${session.startTime}${session.name ? ` · ${session.name}` : ""}`
    : new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(new Date(event!.startsAt));

  return (
    <main className="publicPage">
      <div className="publicPageContainer">
        <PublicHeader />

        <header className="publicEventHero">
          <h2>Mi Reserva</h2>
          <p className="publicMuted">{event!.title}</p>
          <p className="publicMuted">{scheduleLabel}</p>
        </header>

        <section className="publicPanel">
          {drafts.map((draft, index) => (
            <AttendeeForm
              key={draft.id}
              index={index}
              draft={draft}
              ticketTypes={availableTypes}
              onChange={updateDraft}
              onRemove={drafts.length > 1 ? () => removeDraft(draft.id) : undefined}
            />
          ))}

          <button type="button" className="publicLinkButton" onClick={addPerson}>
            + Agregar otra persona
          </button>
        </section>

        {items.length > 0 && (
          <section className="publicPanel">
            <h3>Carrito ({items.length})</h3>
            <ul className="publicCartList">
              {items.map((item) => (
                <li key={item.id} className="publicCartRow">
                  <span>
                    {item.attendeeFirstName} {item.attendeeLastName} — {item.ticketTypeName}
                  </span>
                  <span>{formatMoneyNumber(item.unitPrice + item.menuExtraPrice)}</span>
                  <button
                    type="button"
                    className="publicLinkButton"
                    onClick={() => removeItem(item.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="publicActionsRow">
          <button type="button" className="publicJornadaButton" onClick={addToCart}>
            Agregar al carrito
          </button>
          <button
            type="button"
            className="publicJornadaButton"
            disabled={items.length === 0}
            onClick={() => navigate(publicEventPaths.pago(event!.id))}
          >
            Continuar
          </button>
        </div>
      </div>
    </main>
  );
};
