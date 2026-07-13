import { describe, expect, it } from "vitest";
import {
  buildOccurrenceKey,
  buildSessionsPayload,
  expandSessionOccurrences,
  getEndTimeOptions,
  getNextFreeStartTime,
  getStartTimeOptions,
  mapEventSessionsToState,
  seedSessionsByDate,
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
  publishAtDate: "",
  publishAtTime: "",
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
  it("mantiene dias existentes, rellena con arreglo vacio los dias nuevos y descarta fuera de rango", () => {
    const existing = baseSession({ startTime: "18:00" });

    const next = syncSessionsByDate(
      { "2026-07-09": [existing], "2026-07-01": [baseSession()] },
      ["2026-07-09", "2026-07-10"],
    );

    expect(next["2026-07-09"][0].startTime).toBe("18:00");
    expect(next["2026-07-10"]).toEqual([]);
    expect(next["2026-07-01"]).toBeUndefined();
  });
});

describe("seedSessionsByDate", () => {
  it("rellena cada fecha con clones de las jornadas base con ids nuevos", () => {
    const base = baseSession({ startTime: "12:00" });

    const next = seedSessionsByDate(["2026-07-09", "2026-07-10"], [base]);

    expect(next["2026-07-09"]).toHaveLength(1);
    expect(next["2026-07-10"]).toHaveLength(1);
    expect(next["2026-07-09"][0].startTime).toBe("12:00");
    expect(next["2026-07-09"][0].id).not.toBe(base.id);
    expect(next["2026-07-10"][0].id).not.toBe(base.id);
    expect(next["2026-07-09"][0].id).not.toBe(next["2026-07-10"][0].id);
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
        name: undefined,
        allocations: [{ ticketTypeIndex: 1, quantity: 5 }],
      },
    ]);
  });

  it("incluye el nombre de la jornada, recortado, en el payload", () => {
    const session = baseSession({ capacity: "5", name: "  Taller de te  " });
    const form = baseForm({ baseSessions: [session], ticketTypes: [] });

    const result = buildSessionsPayload(form, ["2026-07-09"]);

    expect(result.error).toBeUndefined();
    expect(result.payload?.[0].name).toBe("Taller de te");
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

describe("getStartTimeOptions", () => {
  it("limita las horas al rango del evento", () => {
    const session = baseSession({ startTime: "12:00" });

    const values = getStartTimeOptions(session, [session], "10:00", "20:00").map(
      (option) => option.value,
    );

    expect(values[0]).toBe("10:00");
    expect(values[values.length - 1]).toBe("20:00");
  });

  it("excluye las horas ocupadas por otras jornadas", () => {
    const sessionA = baseSession({ startTime: "10:00", endTime: "12:00" });
    const sessionB = baseSession({ startTime: "13:00" });

    const values = getStartTimeOptions(
      sessionB,
      [sessionA, sessionB],
      "10:00",
      "20:00",
    ).map((option) => option.value);

    expect(values).not.toContain("10:00");
    expect(values).not.toContain("11:30");
    // Termino exclusivo: una jornada puede partir justo cuando termina la otra.
    expect(values).toContain("12:00");
  });

  it("una jornada sin termino solo bloquea su hora de inicio", () => {
    const sessionA = baseSession({ startTime: "15:00", endTime: "" });
    const sessionB = baseSession({ startTime: "10:00" });

    const values = getStartTimeOptions(
      sessionB,
      [sessionA, sessionB],
      "10:00",
      "20:00",
    ).map((option) => option.value);

    expect(values).not.toContain("15:00");
    expect(values).toContain("15:30");
  });

  it("mantiene la hora actual aunque quede fuera del rango", () => {
    const session = baseSession({ startTime: "08:00" });

    const values = getStartTimeOptions(session, [session], "10:00", "20:00").map(
      (option) => option.value,
    );

    expect(values).toContain("08:00");
  });

  it("ofrece todas las horas cuando el rango del evento es invalido", () => {
    const session = baseSession();

    expect(getStartTimeOptions(session, [session], "", "")).toHaveLength(48);
  });
});

describe("getEndTimeOptions", () => {
  it("solo ofrece horas posteriores al inicio, hasta la siguiente jornada", () => {
    const sessionA = baseSession({ startTime: "10:00" });
    const sessionB = baseSession({ startTime: "14:00", endTime: "16:00" });

    const values = getEndTimeOptions(
      sessionA,
      [sessionA, sessionB],
      "10:00",
      "20:00",
    ).map((option) => option.value);

    expect(values[0]).toBe("10:30");
    expect(values[values.length - 1]).toBe("14:00");
  });

  it("sin otras jornadas llega hasta el termino del evento", () => {
    const session = baseSession({ startTime: "18:00" });

    const values = getEndTimeOptions(session, [session], "10:00", "20:00").map(
      (option) => option.value,
    );

    expect(values[values.length - 1]).toBe("20:00");
  });
});

describe("getNextFreeStartTime", () => {
  it("retorna la primera hora libre dentro del rango", () => {
    const sessionA = baseSession({ startTime: "10:00", endTime: "12:00" });

    expect(getNextFreeStartTime([sessionA], "10:00", "20:00")).toBe("12:00");
  });

  it("sin rango ni jornadas retorna la primera hora disponible", () => {
    expect(getNextFreeStartTime([], "", "")).toBe("00:00");
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
        name: "Taller de te",
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
    expect(draft.name).toBe("Taller de te");
    expect(
      state.sessionAllocations[buildOccurrenceKey("2026-07-09", draft.id)],
    ).toEqual({ "draft-a": "5" });
  });

  it("mapea sesiones sin nombre a name undefined", () => {
    const sessions: EventSession[] = [
      {
        id: "ss-1",
        eventId: "ev-1",
        date: "2026-07-09",
        startTime: "12:00",
        endTime: null,
        capacity: 10,
        name: null,
        allocations: [],
        createdAt: "",
        updatedAt: "",
      },
    ];

    const state = mapEventSessionsToState(sessions, {});
    const draft = state.sessionsByDate["2026-07-09"][0];

    expect(draft.name).toBeUndefined();
  });
});

describe("regresion: dias sin jornadas al editar un evento", () => {
  it("no agrega jornadas fantasma en dias sin sesiones y reproduce las sesiones originales", () => {
    const sessions: EventSession[] = [
      {
        id: "ss-1",
        eventId: "ev-1",
        date: "2026-07-09",
        startTime: "12:00",
        endTime: "15:00",
        capacity: 30,
        name: null,
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
      {
        id: "ss-2",
        eventId: "ev-1",
        date: "2026-07-10",
        startTime: "18:00",
        endTime: null,
        capacity: 10,
        name: null,
        allocations: [],
        createdAt: "",
        updatedAt: "",
      },
    ];

    const ticketTypeIdToDraftId = { "tt-real": "draft-a" };
    const state = mapEventSessionsToState(sessions, ticketTypeIdToDraftId);

    // Incluye una fecha del evento sin ninguna sesion guardada (dia 3).
    const dateKeys = ["2026-07-09", "2026-07-10", "2026-07-11"];

    // Simula el useEffect de auto-sync que corre al abrir el modal de edicion.
    const syncedSessionsByDate = syncSessionsByDate(
      state.sessionsByDate,
      dateKeys,
    );

    expect(syncedSessionsByDate["2026-07-11"]).toEqual([]);

    const form = baseForm({
      sameSessionsEveryDay: false,
      baseSessions: [],
      sessionsByDate: syncedSessionsByDate,
      sessionAllocations: state.sessionAllocations,
      ticketTypes: [
        { id: "draft-a" } as EventFormState["ticketTypes"][number],
      ],
    });

    const result = buildSessionsPayload(form, dateKeys);

    expect(result.error).toBeUndefined();
    expect(result.payload).toEqual([
      {
        date: "2026-07-09",
        startTime: "12:00",
        endTime: "15:00",
        capacity: 30,
        allocations: [{ ticketTypeIndex: 0, quantity: 5 }],
      },
      {
        date: "2026-07-10",
        startTime: "18:00",
        endTime: undefined,
        capacity: 10,
        allocations: undefined,
      },
    ]);
  });
});
