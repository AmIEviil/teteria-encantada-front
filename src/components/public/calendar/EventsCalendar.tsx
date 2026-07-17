import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicEventsQuery } from "../../../core/api/public.hooks";
import { publicEventPaths } from "../../../constant/routes";
import { buildMonthEventMap } from "./events-calendar.utils";
import "../../../views/public/PublicViews.css";

const WEEK_DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const monthFormatter = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  year: "numeric",
});



const toDateKey = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** Lunes = 0, Domingo = 6 */
const weekDayIndex = (date: Date): number => (date.getDay() + 6) % 7;

/** Color estable por evento: mismo id -> mismo tono. */
const eventHue = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
};

export const EventsCalendar = () => {
  const { data: events = [], isLoading } = usePublicEventsQuery();
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const eventsByDay = useMemo(
    () => buildMonthEventMap(events, month.getFullYear(), month.getMonth()),
    [events, month],
  );

  const shiftMonth = (delta: number) =>
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const leadingBlanks = weekDayIndex(month);
  const monthLabel = monthFormatter.format(month);

  return (
    <div className="publicPageContainer">
      <h4 className="text-6xl">Calendario de Actividades</h4>
      <p className="publicMuted">
        Revisa las actividades del mes. Haz click en un evento para ver su
        detalle.
      </p>

      <div className="calendarHeader">
        <button
          type="button"
          className="calendarNavButton"
          onClick={() => shiftMonth(-1)}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="calendarMonthLabel">{monthLabel}</span>
        <button
          type="button"
          className="calendarNavButton"
          onClick={() => shiftMonth(1)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {isLoading ? (
        <p className="publicMuted">Cargando eventos...</p>
      ) : (
        <div className="calendarGrid">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="calendarWeekDay">
              {day}
            </div>
          ))}

          {Array.from({ length: leadingBlanks }, (_, index) => (
            <div
              key={`blank-${index}`}
              className="calendarCell calendarCellEmpty"
            />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const dayEvents = eventsByDay.get(day) ?? [];

            return (
              <div key={day} className="calendarCell">
                <span className="calendarDayNumber">{day}</span>
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="calendarEventCard"
                    style={{
                      background: `hsl(${eventHue(event.id)}, 62%, 90%)`,
                      borderColor: `hsl(${eventHue(event.id)}, 45%, 65%)`,
                    }}
                    title={event.title}
                    onClick={() =>
                      navigate(
                        publicEventPaths.detail(
                          event.id,
                          toDateKey(month.getFullYear(), month.getMonth(), day),
                        ),
                      )
                    }
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
