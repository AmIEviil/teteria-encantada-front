import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PublicHeader } from "../../../components/public/PublicHeader";
import { AttendeeForm } from "../../../components/public/events/AttendeeForm/AttendeeForm";
import {
  buildCartItem,
  checkAvailability,
  isAttendeeDraftValid,
  type AttendeeDraft,
  type AvailabilityCtx,
} from "../../../components/public/events/AttendeeForm/attendee.utils";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { publicEventPaths } from "../../../constant/routes";
import { formatMoneyNumber } from "../../../utils/formatText.utils";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import "../PublicViews.css";

const newId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()}`;

const newDraft = (ticketTypeId: string): AttendeeDraft => ({
  id: newId(),
  firstName: "",
  lastName: "",
  ticketTypeId,
  menuByGroup: {},
});

const sessionDateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
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

  const availabilityCtx: AvailabilityCtx = {
    remainingByType: Object.fromEntries(
      availableTypes.map((t) => [
        t.id,
        session
          ? session.ticketTypes.find((st) => st.ticketTypeId === t.id)?.remaining ?? null
          : t.remaining,
      ]),
    ),
    seatsRemaining: session ? session.seatsRemaining : event?.seatsRemaining ?? null,
  };

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

  // ¿cabe una persona más? probamos con un borrador extra del primer tipo disponible.
  const canAddPerson = checkAvailability(
    items,
    [...drafts, newDraft(availableTypes[0]?.id ?? "")],
    availabilityCtx,
  ).ok;

  const removeDraft = (draftId: string) =>
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));

  const addToCart = () => {
    const typeOf = (tid: string) => availableTypes.find((t) => t.id === tid);
    const allValid = drafts.every((d) => isAttendeeDraftValid(d, typeOf(d.ticketTypeId)));
    if (!allValid) {
      openSnackbar("Completa nombre, apellido y menú de cada persona", "error");
      return;
    }
    const avail = checkAvailability(items, drafts, availabilityCtx);
    if (!avail.ok) {
      openSnackbar(avail.message ?? "No hay cupos disponibles", "error");
      return;
    }
    addItems(drafts.map((d) => buildCartItem(d, typeOf(d.ticketTypeId)!)));
    setDrafts([newDraft(availableTypes[0]?.id ?? "")]);
    openSnackbar("Agregado al carrito", "success");
  };

  const scheduleLabel = session
    ? `${sessionDateFormatter.format(new Date(`${session.date}T00:00:00`))} · ${session.startTime}${session.name ? ` · ${session.name}` : ""}`
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

          <button
            type="button"
            className="publicLinkButton"
            disabled={!canAddPerson}
            onClick={addPerson}
          >
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
