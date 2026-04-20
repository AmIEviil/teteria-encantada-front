import type { ReservationScheduleDay } from "../core/api/types";

export const SLOT_INTERVAL_MINUTES = 30;
export const MIN_SERVICE_START_MINUTES = 10 * 60;
export const MIN_ADVANCE_RESERVATION_HOURS = 4;
export const MAX_ADVANCE_RESERVATION_MONTHS = 6;
export const DEFAULT_OPEN_TIME = "10:00";
export const DEFAULT_CLOSE_TIME = "23:30";

export const WEEK_DAY_OPTIONS: Array<{ dayOfWeek: number; label: string }> = [
  { dayOfWeek: 0, label: "Lunes" },
  { dayOfWeek: 1, label: "Martes" },
  { dayOfWeek: 2, label: "Miercoles" },
  { dayOfWeek: 3, label: "Jueves" },
  { dayOfWeek: 4, label: "Viernes" },
  { dayOfWeek: 5, label: "Sabado" },
  { dayOfWeek: 6, label: "Domingo" },
];

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const buildAllTimeOptions = (): string[] => {
  const options: string[] = [];

  for (
    let minutes = MIN_SERVICE_START_MINUTES;
    minutes <= 23 * 60 + 30;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    options.push(formatTimeFromMinutes(minutes));
  }

  return options;
};

export const normalizePhoneValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const withOnlyDigitsAndPlus = trimmed.replaceAll(/[^0-9+]/g, "");

  if (withOnlyDigitsAndPlus.startsWith("+")) {
    return `+${withOnlyDigitsAndPlus.slice(1).replaceAll("+", "")}`;
  }

  return withOnlyDigitsAndPlus.replaceAll("+", "");
};

export const isValidLookupInput = (value: string): boolean => {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  if (normalized.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  }

  const normalizedPhone = normalizePhoneValue(normalized);
  const onlyDigits = normalizedPhone.replaceAll(/\D/g, "");
  return onlyDigits.length >= 7;
};

export const resolveLookupFilter = (
  lookupInput: string,
): { email?: string; phone?: string } => {
  const normalized = lookupInput.trim();

  if (!normalized) {
    return {};
  }

  if (normalized.includes("@")) {
    return { email: normalized.toLowerCase() };
  }

  const normalizedPhone = normalizePhoneValue(normalized);
  if (!normalizedPhone) {
    return {};
  }

  return { phone: normalizedPhone };
};

export const normalizeScheduleDays = (
  scheduleDays: ReservationScheduleDay[] | undefined,
): ReservationScheduleDay[] => {
  const dayMap = new Map<number, ReservationScheduleDay>();

  (scheduleDays ?? []).forEach((day) => {
    dayMap.set(day.dayOfWeek, day);
  });

  return WEEK_DAY_OPTIONS.map(({ dayOfWeek }) => {
    const current = dayMap.get(dayOfWeek);
    const normalizedOpen = normalizeScheduleOpenTime(current?.opensAt ?? DEFAULT_OPEN_TIME);
    const normalizedClose = normalizeScheduleCloseTime(
      current?.closesAt ?? DEFAULT_CLOSE_TIME,
      normalizedOpen,
    );

    return {
      dayOfWeek,
      isOpen: current?.isOpen ?? true,
      opensAt: normalizedOpen,
      closesAt: normalizedClose,
    };
  });
};

export const buildAvailableDateKeys = (
  scheduleDays: ReservationScheduleDay[] | undefined,
  daysAhead = 186,
): string[] => {
  const normalizedSchedule = normalizeScheduleDays(scheduleDays);
  const result: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxAllowedDate = getMaxAllowedReservationDate();

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    if (date.getTime() > maxAllowedDate.getTime()) {
      break;
    }

    const dayConfig = getScheduleForDate(normalizedSchedule, date);
    if (!dayConfig || !dayConfig.isOpen || !dayConfig.opensAt || !dayConfig.closesAt) {
      continue;
    }

    if (!isTimeRangeValid(dayConfig.opensAt, dayConfig.closesAt)) {
      continue;
    }

    if (buildTimeSlots(dayConfig.opensAt, dayConfig.closesAt, date).length === 0) {
      continue;
    }

    result.push(toDateKey(date));
  }

  return result;
};

export const buildTimeSlotsForDate = (
  dateInput: string,
  scheduleDays: ReservationScheduleDay[] | undefined,
): string[] => {
  const date = parseDateInput(dateInput);
  if (!date) {
    return [];
  }

  const normalizedSchedule = normalizeScheduleDays(scheduleDays);
  const dayConfig = getScheduleForDate(normalizedSchedule, date);

  if (!dayConfig || !dayConfig.isOpen || !dayConfig.opensAt || !dayConfig.closesAt) {
    return [];
  }

  return buildTimeSlots(dayConfig.opensAt, dayConfig.closesAt, date);
};

export const buildTimeSlots = (
  opensAt: string,
  closesAt: string,
  targetDate?: Date,
): string[] => {
  if (!isTimeRangeValid(opensAt, closesAt)) {
    return [];
  }

  const startMinutes = parseTimeToMinutes(opensAt);
  const endMinutes = parseTimeToMinutes(closesAt);
  if (startMinutes === null || endMinutes === null) {
    return [];
  }

  const minAdvanceMinutes = getMinAdvanceStartMinutesForDate(targetDate);
  if (minAdvanceMinutes === Number.POSITIVE_INFINITY) {
    return [];
  }

  const maxAdvanceMinutes = getMaxAdvanceEndMinutesForDate(targetDate);
  if (maxAdvanceMinutes === Number.NEGATIVE_INFINITY) {
    return [];
  }

  const effectiveStartMinutes = Math.max(
    startMinutes,
    MIN_SERVICE_START_MINUTES,
    minAdvanceMinutes,
  );

  const effectiveEndMinutes = Math.min(endMinutes, maxAdvanceMinutes);

  if (effectiveStartMinutes > effectiveEndMinutes) {
    return [];
  }

  const slots: string[] = [];

  for (
    let minutes = effectiveStartMinutes;
    minutes <= effectiveEndMinutes;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    slots.push(formatTimeFromMinutes(minutes));
  }

  return slots;
};

const isTimeRangeValid = (opensAt: string, closesAt: string): boolean => {
  const startMinutes = parseTimeToMinutes(opensAt);
  const endMinutes = parseTimeToMinutes(closesAt);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  const effectiveStartMinutes = Math.max(startMinutes, MIN_SERVICE_START_MINUTES);

  if (effectiveStartMinutes >= endMinutes) {
    return false;
  }

  return (endMinutes - effectiveStartMinutes) % SLOT_INTERVAL_MINUTES === 0;
};

const normalizeScheduleOpenTime = (value: string): string => {
  const parsedMinutes = parseTimeToMinutes(value);
  if (parsedMinutes === null) {
    return DEFAULT_OPEN_TIME;
  }

  return formatTimeFromMinutes(Math.max(parsedMinutes, MIN_SERVICE_START_MINUTES));
};

const normalizeScheduleCloseTime = (value: string, normalizedOpen: string): string => {
  const parsedMinutes = parseTimeToMinutes(value);
  const openMinutes = parseTimeToMinutes(normalizedOpen) ?? MIN_SERVICE_START_MINUTES;

  if (parsedMinutes === null || parsedMinutes <= openMinutes) {
    return formatTimeFromMinutes(openMinutes + SLOT_INTERVAL_MINUTES);
  }

  return formatTimeFromMinutes(parsedMinutes);
};

const getScheduleForDate = (
  scheduleDays: ReservationScheduleDay[],
  date: Date,
): ReservationScheduleDay | undefined => {
  const dayOfWeek = toScheduleDayOfWeek(date);
  return scheduleDays.find((day) => day.dayOfWeek === dayOfWeek);
};

const toScheduleDayOfWeek = (date: Date): number => {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const parseDateInput = (dateInput: string): Date | null => {
  const [year, month, day] = dateInput.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const parseTimeToMinutes = (value: string): number | null => {
  if (!HH_MM_PATTERN.test(value)) {
    return null;
  }

  const [hoursText, minutesText] = value.split(":");
  return Number(hoursText) * 60 + Number(minutesText);
};

const getMinAdvanceStartMinutesForDate = (targetDate?: Date): number => {
  if (!targetDate) {
    return 0;
  }

  const minAllowedDate = new Date(
    Date.now() + MIN_ADVANCE_RESERVATION_HOURS * 60 * 60 * 1000,
  );

  const dateComparison = compareByDateOnly(targetDate, minAllowedDate);

  if (dateComparison < 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (dateComparison > 0) {
    return 0;
  }

  const minMinutes = minAllowedDate.getHours() * 60 + minAllowedDate.getMinutes();
  return Math.ceil(minMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
};

const getMaxAdvanceEndMinutesForDate = (targetDate?: Date): number => {
  if (!targetDate) {
    return Number.POSITIVE_INFINITY;
  }

  const maxAllowedDate = getMaxAllowedReservationDate();
  const dateComparison = compareByDateOnly(targetDate, maxAllowedDate);

  if (dateComparison > 0) {
    return Number.NEGATIVE_INFINITY;
  }

  if (dateComparison < 0) {
    return Number.POSITIVE_INFINITY;
  }

  const maxMinutes = maxAllowedDate.getHours() * 60 + maxAllowedDate.getMinutes();
  return Math.floor(maxMinutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
};

const getMaxAllowedReservationDate = (): Date => {
  const maxAllowedDate = new Date();
  maxAllowedDate.setMonth(maxAllowedDate.getMonth() + MAX_ADVANCE_RESERVATION_MONTHS);
  return maxAllowedDate;
};

const compareByDateOnly = (left: Date, right: Date): number => {
  const leftKey =
    left.getFullYear() * 10000 + (left.getMonth() + 1) * 100 + left.getDate();
  const rightKey =
    right.getFullYear() * 10000 + (right.getMonth() + 1) * 100 + right.getDate();

  if (leftKey === rightKey) {
    return 0;
  }

  return leftKey < rightKey ? -1 : 1;
};

const formatTimeFromMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
