import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicEventsQuery } from "../../../core/api/public.hooks";
import type { PublicEvent } from "../../../core/api/types";
import { publicEventPaths } from "../../../constant/routes";
import "../../../views/public/PublicViews.css";

const WEEK_DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const monthFormatter = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  year: "numeric",
});

const startOfDay = (value: string): Date => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/** Lunes = 0, Domingo = 6 */
const weekDayIndex = (date: Date): number => (date.getDay() + 6) % 7;

/** Día del mes -> eventos activos ese día. Un evento multi-día aparece en cada uno de sus días. */
export const buildMonthEventMap = (
  events: PublicEvent[],
  year: number,
  month: number,
): Map<number, PublicEvent[]> => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const map = new Map<number, PublicEvent[]>();

  for (const event of events) {
    const eventStart = startOfDay(event.startsAt);
    const eventEnd = startOfDay(event.endsAt);
    if (eventEnd < monthStart || eventStart > monthEnd) continue;

    const firstDay = eventStart < monthStart ? 1 : eventStart.getDate();
    const lastDay = eventEnd > monthEnd ? monthEnd.getDate() : eventEnd.getDate();

    for (let day = firstDay; day <= lastDay; day += 1) {
      const dayEvents = map.get(day) ?? [];
      dayEvents.push(event);
      map.set(day, dayEvents);
    }
  }

  return map;
};

const toDateKey = (year: number, month: number, day: number): string =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

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
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = weekDayIndex(month);
  const monthLabel = monthFormatter.format(month);

  return (
    <div className="publicPageContainer">
      <h4 className="text-6xl">Calendario de Actividades</h4>
      <p className="publicMuted">
        Revisa las actividades del mes. Haz click en un evento para ver su detalle.
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
            <div key={`blank-${index}`} className="calendarCell calendarCellEmpty" />
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
