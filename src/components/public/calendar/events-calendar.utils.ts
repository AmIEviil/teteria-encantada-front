import type { PublicEvent } from "../../../core/api/types";

export const startOfDay = (value: string): Date => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

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
    const lastDay =
      eventEnd > monthEnd ? monthEnd.getDate() : eventEnd.getDate();

    for (let day = firstDay; day <= lastDay; day += 1) {
      const dayEvents = map.get(day) ?? [];
      dayEvents.push(event);
      map.set(day, dayEvents);
    }
  }

  return map;
};
