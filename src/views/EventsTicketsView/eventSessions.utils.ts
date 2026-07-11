import type {
  EventSession,
  EventSessionAllocationPayload,
  EventSessionPayload,
} from "../../core/api/types";
import type {
  EventFormState,
  SessionDraft,
  SessionOccurrence,
} from "../../service/events/events.interface";

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${hours}:${minutes}`;

  return {
    value,
    label: value,
  };
});

export const createEmptySessionDraft = (startTime = "12:00"): SessionDraft => ({
  id: crypto.randomUUID(),
  startTime,
  endTime: "",
  capacity: "1",
});

const hasValidTimeWindow = (minTime: string, maxTime: string): boolean =>
  Boolean(minTime && maxTime && minTime < maxTime);

const isWithinTimeWindow = (
  value: string,
  minTime: string,
  maxTime: string,
): boolean =>
  !hasValidTimeWindow(minTime, maxTime) ||
  (value >= minTime && value <= maxTime);

// Una jornada sin termino solo bloquea su hora exacta de inicio.
const isTimeTakenByOthers = (
  value: string,
  others: SessionDraft[],
): boolean =>
  others.some((other) =>
    other.endTime
      ? value >= other.startTime && value < other.endTime
      : value === other.startTime,
  );

export const getStartTimeOptions = (
  session: SessionDraft,
  sessions: SessionDraft[],
  minTime: string,
  maxTime: string,
): typeof TIME_OPTIONS => {
  const others = sessions.filter((other) => other.id !== session.id);

  return TIME_OPTIONS.filter(
    (option) =>
      option.value === session.startTime ||
      (isWithinTimeWindow(option.value, minTime, maxTime) &&
        !isTimeTakenByOthers(option.value, others)),
  );
};

export const getEndTimeOptions = (
  session: SessionDraft,
  sessions: SessionDraft[],
  minTime: string,
  maxTime: string,
): typeof TIME_OPTIONS => {
  const nextStart = sessions
    .filter(
      (other) =>
        other.id !== session.id && other.startTime > session.startTime,
    )
    .map((other) => other.startTime)
    .sort()[0];

  return TIME_OPTIONS.filter(
    (option) =>
      option.value === session.endTime ||
      (isWithinTimeWindow(option.value, minTime, maxTime) &&
        option.value > session.startTime &&
        (!nextStart || option.value <= nextStart)),
  );
};

export const getNextFreeStartTime = (
  sessions: SessionDraft[],
  minTime: string,
  maxTime: string,
): string =>
  TIME_OPTIONS.find(
    (option) =>
      isWithinTimeWindow(option.value, minTime, maxTime) &&
      !isTimeTakenByOthers(option.value, sessions),
  )?.value ?? "12:00";

export const buildOccurrenceKey = (
  date: string,
  sessionDraftId: string,
): string => `${date}|${sessionDraftId}`;

type SessionsFormSlice = Pick<
  EventFormState,
  "hasSessions" | "sameSessionsEveryDay" | "baseSessions" | "sessionsByDate"
>;

export const expandSessionOccurrences = (
  form: SessionsFormSlice,
  dateKeys: string[],
): SessionOccurrence[] => {
  if (!form.hasSessions) {
    return [];
  }

  const sessionsForDate = (date: string): SessionDraft[] =>
    form.sameSessionsEveryDay
      ? form.baseSessions
      : (form.sessionsByDate[date] ?? []);

  return dateKeys.flatMap((date) =>
    sessionsForDate(date).map((session) => ({
      key: buildOccurrenceKey(date, session.id),
      date,
      startTime: session.startTime,
      endTime: session.endTime,
      capacity: session.capacity,
    })),
  );
};

export const syncSessionsByDate = (
  previous: Record<string, SessionDraft[]>,
  dateKeys: string[],
): Record<string, SessionDraft[]> => {
  const next: Record<string, SessionDraft[]> = {};

  for (const date of dateKeys) {
    next[date] = previous[date] ?? [];
  }

  return next;
};

export const seedSessionsByDate = (
  dateKeys: string[],
  baseSessions: SessionDraft[],
): Record<string, SessionDraft[]> => {
  const next: Record<string, SessionDraft[]> = {};

  for (const date of dateKeys) {
    next[date] = baseSessions.map((session) => ({
      ...session,
      id: crypto.randomUUID(),
    }));
  }

  return next;
};

export const buildSessionsPayload = (
  form: EventFormState,
  dateKeys: string[],
): { payload?: EventSessionPayload[]; error?: string } => {
  const occurrences = expandSessionOccurrences(form, dateKeys);

  if (occurrences.length === 0) {
    return { error: "Debes configurar al menos una jornada" };
  }

  const uniqueSlots = new Set<string>();
  const payload: EventSessionPayload[] = [];

  for (const occurrence of occurrences) {
    const slotLabel = `${occurrence.date} ${occurrence.startTime}`;

    if (!occurrence.startTime) {
      return { error: `Falta hora de inicio en una jornada del ${occurrence.date}` };
    }

    if (occurrence.endTime && occurrence.endTime <= occurrence.startTime) {
      return { error: `La jornada del ${slotLabel} tiene hora de termino invalida` };
    }

    const slotKey = `${occurrence.date}|${occurrence.startTime}`;

    if (uniqueSlots.has(slotKey)) {
      return {
        error: `Hay jornadas duplicadas el ${occurrence.date} a las ${occurrence.startTime}`,
      };
    }

    uniqueSlots.add(slotKey);

    const capacity = Number(occurrence.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      return {
        error: `La capacidad de la jornada del ${slotLabel} debe ser un entero mayor a 0`,
      };
    }

    const allocationsByType = form.sessionAllocations[occurrence.key] ?? {};
    const allocations: EventSessionAllocationPayload[] = [];
    let allocationTotal = 0;

    for (const [typeIndex, ticketType] of form.ticketTypes.entries()) {
      const rawQuantity = (allocationsByType[ticketType.id] ?? "").trim();

      if (!rawQuantity) {
        continue;
      }

      const quantity = Number(rawQuantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return {
          error: `El cupo del tipo ${typeIndex + 1} en la jornada del ${slotLabel} no es valido`,
        };
      }

      allocationTotal += quantity;
      allocations.push({ ticketTypeIndex: typeIndex, quantity });
    }

    if (allocationTotal > capacity) {
      return {
        error: `Los cupos por tipo de la jornada del ${slotLabel} superan su capacidad (${capacity})`,
      };
    }

    payload.push({
      date: occurrence.date,
      startTime: occurrence.startTime,
      endTime: occurrence.endTime || undefined,
      capacity,
      allocations: allocations.length > 0 ? allocations : undefined,
    });
  }

  return { payload };
};

export const mapEventSessionsToState = (
  sessions: EventSession[],
  ticketTypeIdToDraftId: Record<string, string>,
): {
  sessionsByDate: Record<string, SessionDraft[]>;
  sessionAllocations: Record<string, Record<string, string>>;
} => {
  const sessionsByDate: Record<string, SessionDraft[]> = {};
  const sessionAllocations: Record<string, Record<string, string>> = {};

  for (const session of sessions) {
    const draft: SessionDraft = {
      id: crypto.randomUUID(),
      startTime: session.startTime,
      endTime: session.endTime ?? "",
      capacity: String(session.capacity),
    };

    sessionsByDate[session.date] = [
      ...(sessionsByDate[session.date] ?? []),
      draft,
    ];

    const allocationsByType: Record<string, string> = {};

    for (const allocation of session.allocations ?? []) {
      const draftTypeId = ticketTypeIdToDraftId[allocation.ticketTypeId];

      if (draftTypeId) {
        allocationsByType[draftTypeId] = String(allocation.quantity);
      }
    }

    if (Object.keys(allocationsByType).length > 0) {
      sessionAllocations[buildOccurrenceKey(session.date, draft.id)] =
        allocationsByType;
    }
  }

  return { sessionsByDate, sessionAllocations };
};
