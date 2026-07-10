import { describe, expect, it } from "vitest";
import {
  buildOccurrenceKey,
  buildSessionsPayload,
  createEmptySessionDraft,
  expandSessionOccurrences,
  mapEventSessionsToState,
  syncSessionsByDate,
} from "./eventSessions.utils";
import type {
  EventFormState,
  SessionDraft,
} from "../../service/events/events.interface";
import type { EventSession } from "../../core/api/types";

const baseSession = (overrides: Partial<SessionDraft> = {}): SessionDraft => ({
  id: crypto.randomUUID(),
  startTime: "12:00",
  endTime: "",
  capacity: "10",
  ...overrides,
});

const baseForm = (overrides: Partial<EventFormState> = {}): EventFormState => ({
  title: "",
  description: "",
  startsAtDate: "2026-07-09",
  startsAtTime: "10:00",
  endsAtDate: "2026-07-10",
  endsAtTime: "23:00",
  officialImageUrl: "",
  status: "ENABLED",
  isFreeEntry: false,
  hasSessions: true,
  sameSessionsEveryDay: true,
  baseSessions: [baseSession()],
  sessionsByDate: {},
  sessionAllocations: {},
  ticketTypes: [],
  ...overrides,
});

describe("expandSessionOccurrences", () => {
  it("replica jornadas base en cada dia cuando sameSessionsEveryDay", () => {
    const sessionA = baseSession({ startTime: "12:00" });
    const sessionB = baseSession({ startTime: "16:00" });
    const form = baseForm({ baseSessions: [sessionA, sessionB] });

    const occurrences = expandSessionOccurrences(form, [
      "2026-07-09",
      "2026-07-10",
    ]);

    expect(occurrences).toHaveLength(4);
    expect(occurrences[0].key).toBe(buildOccurrenceKey("2026-07-09", sessionA.id));
    expect(occurrences[3].startTime).toBe("16:00");
  });

  it("usa sessionsByDate cuando es variable por dia", () => {
    const daySession = baseSession({ startTime: "20:00" });
    const form = baseForm({
      sameSessionsEveryDay: false,
      sessionsByDate: { "2026-07-09": [daySession] },
    });

    const occurrences = expandSessionOccurrences(form, [
      "2026-07-09",
      "2026-07-10",
    ]);

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].date).toBe("2026-07-09");
  });
});

describe("syncSessionsByDate", () => {
  it("mantiene dias existentes, agrega nuevos desde base y descarta fuera de rango", () => {
    const existing = baseSession({ startTime: "18:00" });
    const base = baseSession({ startTime: "12:00" });

    const next = syncSessionsByDate(
      { "2026-07-09": [existing], "2026-07-01": [baseSession()] },
      ["2026-07-09", "2026-07-10"],
      [base],
    );

    expect(next["2026-07-09"][0].startTime).toBe("18:00");
    expect(next["2026-07-10"][0].startTime).toBe("12:00");
    expect(next["2026-07-10"][0].id).not.toBe(base.id);
    expect(next["2026-07-01"]).toBeUndefined();
  });
});

describe("buildSessionsPayload", () => {
  it("genera payload con allocations por indice de tipo", () => {
    const session = baseSession({ capacity: "30" });
    const form = baseForm({
      baseSessions: [session],
      ticketTypes: [
        { id: "draft-a" } as EventFormState["ticketTypes"][number],
        { id: "draft-b" } as EventFormState["ticketTypes"][number],
      ],
      sessionAllocations: {
        [buildOccurrenceKey("2026-07-09", session.id)]: {
          "draft-b": "5",
        },
      },
    });

    const result = buildSessionsPayload(form, ["2026-07-09"]);

    expect(result.error).toBeUndefined();
    expect(result.payload).toEqual([
      {
        date: "2026-07-09",
        startTime: "12:00",
        endTime: undefined,
        capacity: 30,
        allocations: [{ ticketTypeIndex: 1, quantity: 5 }],
      },
    ]);
  });

  it("rechaza suma de cupos mayor a capacidad", () => {
    const session = baseSession({ capacity: "10" });
    const form = baseForm({
      baseSessions: [session],
      ticketTypes: [{ id: "draft-a" } as EventFormState["ticketTypes"][number]],
      sessionAllocations: {
        [buildOccurrenceKey("2026-07-09", session.id)]: { "draft-a": "11" },
      },
    });

    expect(buildSessionsPayload(form, ["2026-07-09"]).error).toContain(
      "superan su capacidad",
    );
  });

  it("rechaza jornadas duplicadas en un mismo dia", () => {
    const form = baseForm({
      baseSessions: [
        baseSession({ startTime: "12:00" }),
        baseSession({ startTime: "12:00" }),
      ],
    });

    expect(buildSessionsPayload(form, ["2026-07-09"]).error).toContain(
      "duplicadas",
    );
  });

  it("rechaza cuando no hay jornadas", () => {
    const form = baseForm({ baseSessions: [] });

    expect(buildSessionsPayload(form, ["2026-07-09"]).error).toBeTruthy();
  });
});

describe("mapEventSessionsToState", () => {
  it("agrupa por fecha y traduce allocations a drafts", () => {
    const sessions: EventSession[] = [
      {
        id: "ss-1",
        eventId: "ev-1",
        date: "2026-07-09",
        startTime: "12:00",
        endTime: "15:00",
        capacity: 30,
        allocations: [
          {
            id: "al-1",
            sessionId: "ss-1",
            ticketTypeId: "tt-real",
            quantity: 5,
          },
        ],
        createdAt: "",
        updatedAt: "",
      },
    ];

    const state = mapEventSessionsToState(sessions, { "tt-real": "draft-a" });
    const draft = state.sessionsByDate["2026-07-09"][0];

    expect(draft.capacity).toBe("30");
    expect(draft.endTime).toBe("15:00");
    expect(
      state.sessionAllocations[buildOccurrenceKey("2026-07-09", draft.id)],
    ).toEqual({ "draft-a": "5" });
  });
});
