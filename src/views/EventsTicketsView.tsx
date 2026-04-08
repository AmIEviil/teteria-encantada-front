import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayIcon from "@mui/icons-material/Replay";
import SettingsIcon from "@mui/icons-material/Settings";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import {
  useCreateEventMutation,
  useCreateEventTicketMutation,
  useDeleteEventMutation,
  useDeleteEventTicketMutation,
  useEventsQuery,
  useEventTicketsQuery,
  useUpdateEventMutation,
  useUpdateEventTicketMutation,
} from "../core/api/events.hooks";
import type {
  CreateVenueEventPayload,
  EventTicketMenuMode,
  EventTicketMenuSelection,
  EventTicketMenuTemplate,
  EventStatus,
  EventTicket,
  EventTicketStatus,
  EventTicketTypePayload,
  UpdateEventTicketPayload,
  VenueEvent,
} from "../core/api/types";
import { CustomCalendarV2 } from "../components/ui/calendar/CustomCalendarV2";
import { EventWizardProgress } from "../components/events/EventWizardProgress";
import { useSnackBarResponseStore } from "../store/snackBarStore";
import "./EventsTicketsView.css";

type EventFilterStatus = EventStatus | "ALL";
type TicketFilterStatus = EventTicketStatus | "ALL";
type EventWizardStep = 0 | 1 | 2;

interface TicketDailyStockDraft {
  id: string;
  date: string;
  quantity: string;
}

interface TicketTypeDraft {
  id: string;
  name: string;
  description: string;
  price: string;
  includesDetails: string;
  menuMode: EventTicketMenuMode;
  menuTemplate: TicketMenuTemplateDraft;
  totalStock: string;
  isPromotional: boolean;
  promoMinQuantity: string;
  promoBundlePrice: string;
  dailyStocks: TicketDailyStockDraft[];
}

interface TicketMenuOptionDraft {
  id: string;
  optionId: string;
  label: string;
  extraPrice: string;
  isActive: boolean;
}

interface TicketMenuGroupDraft {
  id: string;
  key: string;
  label: string;
  required: boolean;
  minSelect: string;
  maxSelect: string;
  options: TicketMenuOptionDraft[];
}

interface TicketMenuTemplateDraft {
  groups: TicketMenuGroupDraft[];
}

interface EventFormState {
  title: string;
  description: string;
  startsAtDate: string;
  startsAtTime: string;
  endsAtDate: string;
  endsAtTime: string;
  officialImageUrl: string;
  status: EventStatus;
  isFreeEntry: boolean;
  ticketTypes: TicketTypeDraft[];
}

interface TicketFormState {
  ticketTypeId: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  attendanceDate: string;
  quantity: string;
  applyPromotion: boolean;
  menuSelectionByGroup: Record<string, string[]>;
}

const MENU_GROUP_PRESETS: Array<{ key: string; label: string }> = [
  { key: "entrada", label: "Entrada" },
  { key: "plato_fondo", label: "Plato de fondo" },
  { key: "bebestible", label: "Bebestible" },
  { key: "postre", label: "Postre" },
];

const EVENT_STATUS_OPTIONS: Array<{ value: EventStatus; label: string }> = [
  { value: "ENABLED", label: "Habilitado" },
  { value: "SUSPENDED", label: "Suspendido" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "RESCHEDULED", label: "Re-agendado" },
];

const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  ENABLED: "Habilitado",
  CANCELLED: "Cancelado",
  SUSPENDED: "Suspendido",
  RESCHEDULED: "Re-agendado",
};

const TICKET_STATUS_OPTIONS: Array<{ value: EventTicketStatus; label: string }> = [
  { value: "ACTIVE", label: "Activo" },
  { value: "CANCELLED", label: "Cancelado" },
];

const TICKET_STATUS_LABEL: Record<EventTicketStatus, string> = {
  ACTIVE: "Activo",
  CANCELLED: "Cancelado",
};

const WIZARD_STEPS: Array<{ value: EventWizardStep; label: string }> = [
  { value: 0, label: "Evento" },
  { value: 1, label: "Tickets y cupos" },
  { value: 2, label: "Confirmacion" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${hours}:${minutes}`;

  return {
    value,
    label: value,
  };
});

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseLocalDateString = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const getTodayDate = (): string => toLocalDateString(new Date());

const toValidDate = (value: string): Date | null => {
  const localDate = parseLocalDateString(value);

  if (localDate) {
    return localDate;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const toDateAndTime = (value: string): { date: string; time: string } => {
  const dateObj = new Date(value);

  if (Number.isNaN(dateObj.getTime())) {
    return { date: "", time: "" };
  }

  const date = toLocalDateString(dateObj);
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const time = `${hours}:${minutes}`;

  return { date, time };
};

const toIsoDateTime = (date: string, time: string): string => {
  return `${date}T${time}:00`;
};

const toDateOnlyKey = (value: string): string => {
  return value.slice(0, 10);
};

const buildDateRangeKeys = (
  startDateInput: string,
  endDateInput: string,
): string[] | undefined => {
  const startDate = toValidDate(startDateInput);
  const endDate = toValidDate(endDateInput);

  if (!startDate || !endDate) {
    return undefined;
  }

  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(0, 0, 0, 0);

  if (cursor > rangeEnd) {
    return undefined;
  }

  const keys: string[] = [];

  while (cursor <= rangeEnd && keys.length < 800) {
    keys.push(toLocalDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
};

const formatDateKeyLabel = (dateKey: string): string => {
  const parsedDate = parseLocalDateString(dateKey);

  if (!parsedDate) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short" }).format(parsedDate);
};

const slugifyValue = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
};

const createMenuOptionDraft = (
  label = "",
  optionId?: string,
): TicketMenuOptionDraft => ({
  id: crypto.randomUUID(),
  optionId: optionId ?? slugifyValue(label),
  label,
  extraPrice: "0",
  isActive: true,
});

const createMenuGroupDraft = (
  key = "",
  label = "",
): TicketMenuGroupDraft => ({
  id: crypto.randomUUID(),
  key,
  label,
  required: true,
  minSelect: "1",
  maxSelect: "1",
  options: [createMenuOptionDraft()],
});

const createDefaultMenuTemplateDraft = (): TicketMenuTemplateDraft => ({
  groups: MENU_GROUP_PRESETS.map((preset) =>
    createMenuGroupDraft(preset.key, preset.label),
  ),
});

const summarizeEventDailyCapacity = (eventItem: VenueEvent): Array<[string, number]> => {
  const dailyMap = new Map<string, number>();

  for (const ticketType of eventItem.ticketTypes) {
    for (const dailyStock of ticketType.dailyStocks) {
      const currentQuantity = dailyMap.get(dailyStock.date) ?? 0;
      dailyMap.set(dailyStock.date, currentQuantity + dailyStock.quantity);
    }
  }

  return Array.from(dailyMap.entries()).sort((left, right) =>
    left[0].localeCompare(right[0]),
  );
};

const validateDailyStocks = (
  dailyStocks: Array<{ date: string; quantity: number }>,
  typeNumber: number,
  eventStartsAtDate: string,
  eventEndsAtDate: string,
  totalStock?: number,
): string | undefined => {
  const uniqueDates = new Set<string>();
  let dailyStockTotal = 0;

  for (const dailyStock of dailyStocks) {
    if (uniqueDates.has(dailyStock.date)) {
      return `El ticket ${typeNumber} tiene fechas duplicadas en cupos por dia`;
    }

    if (
      eventStartsAtDate &&
      eventEndsAtDate &&
      (dailyStock.date < eventStartsAtDate || dailyStock.date > eventEndsAtDate)
    ) {
      return `El ticket ${typeNumber} tiene cupos por dia fuera del rango del evento`;
    }

    uniqueDates.add(dailyStock.date);
    dailyStockTotal += dailyStock.quantity;
  }

  if (totalStock && dailyStockTotal > totalStock) {
    return `El ticket ${typeNumber} supera el Cupo total (${totalStock}). Ajusta cupos diarios o cupo total.`;
  }

  return undefined;
};

const createEmptyDailyStock = (date = getTodayDate()): TicketDailyStockDraft => ({
  id: crypto.randomUUID(),
  date,
  quantity: "1",
});

const createEmptyTicketType = (): TicketTypeDraft => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  price: "0",
  includesDetails: "",
  menuMode: "FIXED",
  menuTemplate: createDefaultMenuTemplateDraft(),
  totalStock: "",
  isPromotional: false,
  promoMinQuantity: "2",
  promoBundlePrice: "",
  dailyStocks: [createEmptyDailyStock()],
});

const createInitialEventForm = (): EventFormState => {
  const today = getTodayDate();

  return {
    title: "",
    description: "",
    startsAtDate: today,
    startsAtTime: "18:00",
    endsAtDate: today,
    endsAtTime: "23:00",
    officialImageUrl: "",
    status: "ENABLED",
    isFreeEntry: false,
    ticketTypes: [createEmptyTicketType()],
  };
};

const createInitialTicketForm = (selectedEvent: VenueEvent | null): TicketFormState => {
  const defaultTicketType = selectedEvent?.ticketTypes[0];
  const defaultDate = selectedEvent
    ? toLocalDateString(new Date(selectedEvent.startsAt))
    : getTodayDate();

  const menuSelectionByGroup: Record<string, string[]> = {};

  if (defaultTicketType?.menuMode === "CUSTOMIZABLE") {
    for (const group of defaultTicketType.menuTemplate?.groups ?? []) {
      menuSelectionByGroup[group.key] = [];
    }
  }

  return {
    ticketTypeId: defaultTicketType?.id ?? "",
    attendeeFirstName: "",
    attendeeLastName: "",
    attendanceDate: defaultDate,
    quantity: "1",
    applyPromotion: false,
    menuSelectionByGroup,
  };
};

const parseMenuOptionPayload = (
  option: TicketMenuOptionDraft,
  optionIndex: number,
  groupLabel: string,
  typeNumber: number,
  uniqueOptionIds: Set<string>,
): {
  payload?: EventTicketMenuTemplate["groups"][number]["options"][number];
  error?: string;
} => {
  const optionLabel = option.label.trim();
  const optionId = slugifyValue(
    option.optionId || optionLabel || `opcion_${optionIndex + 1}`,
  );
  const extraPrice = Number(option.extraPrice || "0");

  if (!optionLabel || !optionId) {
    return {
      error: `El grupo ${groupLabel} del ticket ${typeNumber} tiene opciones sin nombre`,
    };
  }

  if (uniqueOptionIds.has(optionId)) {
    return {
      error: `El grupo ${groupLabel} del ticket ${typeNumber} tiene opciones repetidas`,
    };
  }

  if (Number.isNaN(extraPrice) || extraPrice < 0) {
    return {
      error: `La opcion ${optionLabel} del ticket ${typeNumber} tiene recargo invalido`,
    };
  }

  uniqueOptionIds.add(optionId);

  return {
    payload: {
      id: optionId,
      label: optionLabel,
      extraPrice,
      isActive: option.isActive,
    },
  };
};

const parseMenuGroupSelectionLimits = (
  group: TicketMenuGroupDraft,
  label: string,
  typeNumber: number,
): {
  minSelect?: number;
  maxSelect?: number;
  error?: string;
} => {
  const minSelect = Number(group.minSelect || (group.required ? "1" : "0"));
  const maxSelect = Number(group.maxSelect || "1");

  if (!Number.isInteger(minSelect) || minSelect < 0) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} tiene minimo invalido`,
    };
  }

  if (!Number.isInteger(maxSelect) || maxSelect < 1) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} tiene maximo invalido`,
    };
  }

  if (minSelect > maxSelect) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} tiene minimo mayor al maximo`,
    };
  }

  return {
    minSelect,
    maxSelect,
  };
};

const parseMenuGroupOptionsPayload = (
  group: TicketMenuGroupDraft,
  label: string,
  typeNumber: number,
): {
  options?: EventTicketMenuTemplate["groups"][number]["options"];
  error?: string;
} => {
  if (group.options.length === 0) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} debe tener opciones`,
    };
  }

  const uniqueOptionIds = new Set<string>();
  const normalizedOptions: EventTicketMenuTemplate["groups"][number]["options"] = [];

  for (const [optionIndex, option] of group.options.entries()) {
    const parsedOption = parseMenuOptionPayload(
      option,
      optionIndex,
      label,
      typeNumber,
      uniqueOptionIds,
    );

    if (parsedOption.error) {
      return {
        error: parsedOption.error,
      };
    }

    if (parsedOption.payload) {
      normalizedOptions.push(parsedOption.payload);
    }
  }

  return {
    options: normalizedOptions,
  };
};

const parseMenuGroupPayload = (
  group: TicketMenuGroupDraft,
  groupIndex: number,
  typeNumber: number,
  uniqueGroupKeys: Set<string>,
): {
  payload?: EventTicketMenuTemplate["groups"][number];
  error?: string;
} => {
  const groupNumber = groupIndex + 1;
  const key = slugifyValue(group.key || group.label);
  const label = group.label.trim();

  if (!key) {
    return {
      error: `El grupo ${groupNumber} del ticket ${typeNumber} debe tener clave`,
    };
  }

  if (!label) {
    return {
      error: `El grupo ${groupNumber} del ticket ${typeNumber} debe tener nombre`,
    };
  }

  if (uniqueGroupKeys.has(key)) {
    return {
      error: `El ticket ${typeNumber} tiene grupos de menu repetidos`,
    };
  }

  uniqueGroupKeys.add(key);

  const limits = parseMenuGroupSelectionLimits(group, label, typeNumber);

  if (limits.error) {
    return {
      error: limits.error,
    };
  }

  const optionsPayload = parseMenuGroupOptionsPayload(group, label, typeNumber);

  if (optionsPayload.error) {
    return {
      error: optionsPayload.error,
    };
  }

  const minSelect = limits.minSelect ?? 0;
  const maxSelect = limits.maxSelect ?? 1;
  const normalizedOptions = optionsPayload.options ?? [];

  const activeOptions = normalizedOptions.filter((option) => option.isActive);

  if (activeOptions.length === 0) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} debe tener al menos una opcion activa`,
    };
  }

  if (activeOptions.length < minSelect) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} no tiene suficientes opciones activas para el minimo`,
    };
  }

  if (maxSelect > activeOptions.length) {
    return {
      error: `El grupo ${label} del ticket ${typeNumber} supera las opciones activas disponibles`,
    };
  }

  return {
    payload: {
      key,
      label,
      required: group.required,
      minSelect,
      maxSelect,
      options: normalizedOptions,
    },
  };
};

const parseMenuTemplatePayload = (
  ticketType: TicketTypeDraft,
  typeNumber: number,
): { payload?: EventTicketMenuTemplate; error?: string } => {
  if (ticketType.menuMode !== "CUSTOMIZABLE") {
    return {};
  }

  if (ticketType.menuTemplate.groups.length === 0) {
    return {
      error: `El ticket ${typeNumber} debe definir al menos un grupo de menu`,
    };
  }

  const uniqueGroupKeys = new Set<string>();
  const groups: EventTicketMenuTemplate["groups"] = [];

  for (const [groupIndex, group] of ticketType.menuTemplate.groups.entries()) {
    const parsedGroup = parseMenuGroupPayload(
      group,
      groupIndex,
      typeNumber,
      uniqueGroupKeys,
    );

    if (parsedGroup.error) {
      return {
        error: parsedGroup.error,
      };
    }

    if (parsedGroup.payload) {
      groups.push(parsedGroup.payload);
    }
  }

  return {
    payload: { groups },
  };
};

const parseTicketTypePayload = (
  ticketType: TicketTypeDraft,
  index: number,
  eventStartsAtDate: string,
  eventEndsAtDate: string,
): { payload?: EventTicketTypePayload; error?: string } => {
  const typeNumber = index + 1;
  const name = ticketType.name.trim();

  if (!name) {
    return {
      error: `Debes nombrar el tipo de ticket ${typeNumber}`,
    };
  }

  const price = Number(ticketType.price);

  if (Number.isNaN(price) || price < 0) {
    return {
      error: `El precio del ticket ${typeNumber} no es valido`,
    };
  }

  const totalStockRaw = ticketType.totalStock.trim();
  let totalStock: number | undefined;

  if (totalStockRaw) {
    const parsedTotalStock = Number(totalStockRaw);

    if (!Number.isInteger(parsedTotalStock) || parsedTotalStock < 1) {
      return {
        error: `El cupo total del ticket ${typeNumber} debe ser un entero mayor a 0`,
      };
    }

    totalStock = parsedTotalStock;
  }

  const dailyStocks = ticketType.dailyStocks
    .map((dailyStock) => {
      const quantity = Number(dailyStock.quantity);

      return {
        date: dailyStock.date,
        quantity,
      };
    })
    .filter(
      (dailyStock) =>
        dailyStock.date.trim().length > 0 &&
        Number.isInteger(dailyStock.quantity) &&
        dailyStock.quantity >= 1,
    );

  if (!totalStock && dailyStocks.length === 0) {
    return {
      error: `El ticket ${typeNumber} debe tener cupo total o al menos un cupo por dia`,
    };
  }

  const dailyStockValidationError = validateDailyStocks(
    dailyStocks,
    typeNumber,
    eventStartsAtDate,
    eventEndsAtDate,
    totalStock,
  );

  if (dailyStockValidationError) {
    return {
      error: dailyStockValidationError,
    };
  }

  const promotion = parsePromotionDraft(ticketType, typeNumber, price);

  if (promotion.error) {
    return {
      error: promotion.error,
    };
  }

  const menuTemplate = parseMenuTemplatePayload(ticketType, typeNumber);

  if (menuTemplate.error) {
    return {
      error: menuTemplate.error,
    };
  }

  return {
    payload: {
      name,
      description: ticketType.description.trim() || undefined,
      price,
      includesDetails: ticketType.includesDetails.trim() || undefined,
      menuMode: ticketType.menuMode,
      menuTemplate: menuTemplate.payload,
      totalStock,
      isPromotional: ticketType.isPromotional,
      promoMinQuantity: promotion.promoMinQuantity,
      promoBundlePrice: promotion.promoBundlePrice,
      dailyStocks: dailyStocks.length > 0 ? dailyStocks : undefined,
    },
  };
};

const parsePromotionDraft = (
  ticketType: TicketTypeDraft,
  typeNumber: number,
  price: number,
): {
  promoMinQuantity?: number;
  promoBundlePrice?: number;
  error?: string;
} => {
  if (!ticketType.isPromotional) {
    return {};
  }

  const parsedMinQuantity = Number(ticketType.promoMinQuantity || "2");

  if (!Number.isInteger(parsedMinQuantity) || parsedMinQuantity < 2) {
    return {
      error: `La promo del ticket ${typeNumber} debe tener una cantidad minima de 2`,
    };
  }

  const fallbackBundlePrice = price * parsedMinQuantity;
  const parsedBundlePrice = Number(
    ticketType.promoBundlePrice.trim() || fallbackBundlePrice,
  );

  if (Number.isNaN(parsedBundlePrice) || parsedBundlePrice < 0) {
    return {
      error: `El precio promocional del ticket ${typeNumber} no es valido`,
    };
  }

  if (parsedBundlePrice >= fallbackBundlePrice) {
    return {
      error: `La promo del ticket ${typeNumber} debe ser mas barata que el precio normal del bloque`,
    };
  }

  return {
    promoMinQuantity: parsedMinQuantity,
    promoBundlePrice: parsedBundlePrice,
  };
};

const mapMenuTemplateToDraft = (
  menuMode: EventTicketMenuMode,
  menuTemplate: EventTicketMenuTemplate | null,
): TicketMenuTemplateDraft => {
  if (menuMode !== "CUSTOMIZABLE") {
    return createDefaultMenuTemplateDraft();
  }

  const groups = (menuTemplate?.groups ?? []).map((group) => ({
    id: crypto.randomUUID(),
    key: group.key,
    label: group.label,
    required: group.required,
    minSelect: String(group.minSelect),
    maxSelect: String(group.maxSelect),
    options:
      group.options.length > 0
        ? group.options.map((option) => ({
            id: crypto.randomUUID(),
            optionId: option.id,
            label: option.label,
            extraPrice: String(option.extraPrice),
            isActive: option.isActive,
          }))
        : [createMenuOptionDraft()],
  }));

  return {
    groups: groups.length > 0 ? groups : [createMenuGroupDraft()],
  };
};

const mapEventTicketTypeToDraft = (
  ticketType: VenueEvent["ticketTypes"][number],
  fallbackDate: string,
): TicketTypeDraft => ({
  id: crypto.randomUUID(),
  name: ticketType.name,
  description: ticketType.description ?? "",
  price: String(ticketType.price),
  includesDetails: ticketType.includesDetails ?? "",
  menuMode: ticketType.menuMode,
  menuTemplate: mapMenuTemplateToDraft(ticketType.menuMode, ticketType.menuTemplate),
  totalStock: ticketType.totalStock === null ? "" : String(ticketType.totalStock),
  isPromotional: ticketType.isPromotional,
  promoMinQuantity:
    ticketType.promoMinQuantity === null ? "2" : String(ticketType.promoMinQuantity),
  promoBundlePrice:
    ticketType.promoBundlePrice === null ? "" : String(ticketType.promoBundlePrice),
  dailyStocks:
    ticketType.dailyStocks.length > 0
      ? ticketType.dailyStocks.map((dailyStock) => ({
          id: crypto.randomUUID(),
          date: dailyStock.date,
          quantity: String(dailyStock.quantity),
        }))
      : [createEmptyDailyStock(fallbackDate)],
});

const buildTicketMenuSelectionPayload = (
  ticketType: VenueEvent["ticketTypes"][number],
  menuSelectionByGroup: Record<string, string[]>,
): { payload?: EventTicketMenuSelection; error?: string } => {
  if (ticketType.menuMode !== "CUSTOMIZABLE") {
    return {};
  }

  const groups = ticketType.menuTemplate?.groups ?? [];
  const menuSelectionGroups: EventTicketMenuSelection["groups"] = [];

  for (const group of groups) {
    const selectedOptionIds = menuSelectionByGroup[group.key] ?? [];

    if (selectedOptionIds.length < group.minSelect) {
      return {
        error: `Debes seleccionar al menos ${group.minSelect} opcion(es) en ${group.label}`,
      };
    }

    if (selectedOptionIds.length > group.maxSelect) {
      return {
        error: `Solo puedes seleccionar hasta ${group.maxSelect} opcion(es) en ${group.label}`,
      };
    }

    menuSelectionGroups.push({
      groupKey: group.key,
      optionIds: selectedOptionIds,
    });
  }

  return {
    payload: {
      groups: menuSelectionGroups,
    },
  };
};

const buildPromotionPayload = (
  ticketType: VenueEvent["ticketTypes"][number],
  quantityInput: string,
  applyPromotion: boolean,
): {
  quantity?: number;
  applyPromotion?: boolean;
  estimatedTotal?: number;
  error?: string;
} => {
  const quantity = Number(quantityInput || "1");

  if (!Number.isInteger(quantity) || quantity < 1) {
    return {
      error: "La cantidad de tickets debe ser un entero mayor o igual a 1",
    };
  }

  if (!applyPromotion) {
    return {
      quantity,
      estimatedTotal: quantity * ticketType.price,
    };
  }

  if (
    !ticketType.isPromotional ||
    ticketType.promoMinQuantity === null ||
    ticketType.promoBundlePrice === null
  ) {
    return {
      error: "El tipo de ticket seleccionado no tiene una promo disponible",
    };
  }

  if (quantity < ticketType.promoMinQuantity) {
    return {
      error: `Para promo debes registrar al menos ${ticketType.promoMinQuantity} tickets`,
    };
  }

  const promoBlocks = Math.floor(quantity / ticketType.promoMinQuantity);
  const promoTickets = promoBlocks * ticketType.promoMinQuantity;
  const regularTickets = quantity - promoTickets;
  const estimatedTotal =
    promoBlocks * ticketType.promoBundlePrice + regularTickets * ticketType.price;

  return {
    quantity,
    applyPromotion: true,
    estimatedTotal,
  };
};

const removeMenuOptionFromGroups = (
  groups: TicketMenuGroupDraft[],
  groupId: string,
  optionId: string,
): TicketMenuGroupDraft[] => {
  return groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    const nextOptions = group.options.filter((option) => option.id !== optionId);

    return {
      ...group,
      options: nextOptions.length > 0 ? nextOptions : [createMenuOptionDraft()],
    };
  });
};

const updateMenuOptionInGroups = (
  groups: TicketMenuGroupDraft[],
  groupId: string,
  optionId: string,
  field: keyof Omit<TicketMenuOptionDraft, "id">,
  value: string | boolean,
): TicketMenuGroupDraft[] => {
  return groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    return {
      ...group,
      options: group.options.map((option) => {
        if (option.id !== optionId) {
          return option;
        }

        const updatedOption = {
          ...option,
          [field]: value,
        } as TicketMenuOptionDraft;

        if (field === "label") {
          updatedOption.optionId = slugifyValue(String(value));
        }

        return updatedOption;
      }),
    };
  });
};

interface TicketTypeEditorCardProps {
  ticketType: TicketTypeDraft;
  index: number;
  availableDateKeys?: string[];
  onRemoveTicketType: (ticketTypeId: string) => void;
  onTicketTypeFieldChange: (
    ticketTypeId: string,
    field: keyof Omit<TicketTypeDraft, "id" | "dailyStocks" | "menuTemplate">,
    value: string | boolean,
  ) => void;
  onAddDailyStock: (ticketTypeId: string) => void;
  onRemoveDailyStock: (ticketTypeId: string, dailyStockId: string) => void;
  onDailyStockFieldChange: (
    ticketTypeId: string,
    dailyStockId: string,
    field: keyof Omit<TicketDailyStockDraft, "id">,
    value: string,
  ) => void;
  onAddMenuGroup: (ticketTypeId: string) => void;
  onRemoveMenuGroup: (ticketTypeId: string, groupId: string) => void;
  onMenuGroupFieldChange: (
    ticketTypeId: string,
    groupId: string,
    field: keyof Omit<TicketMenuGroupDraft, "id" | "options">,
    value: string | boolean,
  ) => void;
  onAddMenuOption: (ticketTypeId: string, groupId: string) => void;
  onRemoveMenuOption: (
    ticketTypeId: string,
    groupId: string,
    optionId: string,
  ) => void;
  onMenuOptionFieldChange: (
    ticketTypeId: string,
    groupId: string,
    optionId: string,
    field: keyof Omit<TicketMenuOptionDraft, "id">,
    value: string | boolean,
  ) => void;
}

const TicketTypeEditorCard = ({
  ticketType,
  index,
  availableDateKeys,
  onRemoveTicketType,
  onTicketTypeFieldChange,
  onAddDailyStock,
  onRemoveDailyStock,
  onDailyStockFieldChange,
  onAddMenuGroup,
  onRemoveMenuGroup,
  onMenuGroupFieldChange,
  onAddMenuOption,
  onRemoveMenuOption,
  onMenuOptionFieldChange,
}: TicketTypeEditorCardProps) => {
  return (
    <Paper variant="outlined" className="event-ticket-type-card">
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>Tipo {index + 1}</Typography>
          <IconButton
            onClick={() => onRemoveTicketType(ticketType.id)}
            aria-label={`Eliminar tipo ${index + 1}`}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
          <TextField
            label="Nombre"
            value={ticketType.name}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "name", event.target.value)
            }
            fullWidth
          />

          <TextField
            label="Precio"
            type="number"
            value={ticketType.price}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "price", event.target.value)
            }
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            fullWidth
          />

          <TextField
            label="Cupo total (opcional)"
            type="number"
            value={ticketType.totalStock}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "totalStock", event.target.value)
            }
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            fullWidth
          />
        </Stack>

        <TextField
          label="Descripcion"
          value={ticketType.description}
          onChange={(event) =>
            onTicketTypeFieldChange(ticketType.id, "description", event.target.value)
          }
          fullWidth
        />

        <FormControlLabel
          control={
            <Switch
              checked={ticketType.menuMode === "CUSTOMIZABLE"}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "menuMode",
                  event.target.checked ? "CUSTOMIZABLE" : "FIXED",
                )
              }
            />
          }
          label="Cena personalizada"
        />

        {ticketType.menuMode === "FIXED" ? (
          <TextField
            label="Que incluye"
            value={ticketType.includesDetails}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "includesDetails", event.target.value)
            }
            fullWidth
          />
        ) : (
          <Stack spacing={1.1}>
            <TextField
              label="Descripcion general (opcional)"
              value={ticketType.includesDetails}
              onChange={(event) =>
                onTicketTypeFieldChange(ticketType.id, "includesDetails", event.target.value)
              }
              fullWidth
            />

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Grupos de menu</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => onAddMenuGroup(ticketType.id)}
              >
                Agregar grupo
              </Button>
            </Stack>

            <Stack spacing={1}>
              {ticketType.menuTemplate.groups.map((group, groupIndex) => (
                <Paper key={group.id} variant="outlined" sx={{ p: 1.1 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={600}>Grupo {groupIndex + 1}</Typography>
                      <IconButton
                        onClick={() => onRemoveMenuGroup(ticketType.id, group.id)}
                        aria-label={`Eliminar grupo ${groupIndex + 1}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <TextField
                        label="Nombre del grupo"
                        value={group.label}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "label",
                            event.target.value,
                          )
                        }
                        fullWidth
                      />

                      <TextField
                        label="Clave"
                        value={group.key}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "key",
                            event.target.value,
                          )
                        }
                        fullWidth
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <TextField
                        label="Minimo seleccion"
                        type="number"
                        value={group.minSelect}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "minSelect",
                            event.target.value,
                          )
                        }
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        fullWidth
                      />

                      <TextField
                        label="Maximo seleccion"
                        type="number"
                        value={group.maxSelect}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "maxSelect",
                            event.target.value,
                          )
                        }
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                        fullWidth
                      />
                    </Stack>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={group.required}
                          onChange={(event) =>
                            onMenuGroupFieldChange(
                              ticketType.id,
                              group.id,
                              "required",
                              event.target.checked,
                            )
                          }
                        />
                      }
                      label="Grupo obligatorio"
                    />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={600}>Opciones</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => onAddMenuOption(ticketType.id, group.id)}
                      >
                        Agregar opcion
                      </Button>
                    </Stack>

                    <Stack spacing={0.9}>
                      {group.options.map((option, optionIndex) => (
                        <Stack
                          key={option.id}
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                          alignItems={{ md: "center" }}
                        >
                          <TextField
                            label={`Opcion ${optionIndex + 1}`}
                            value={option.label}
                            onChange={(event) =>
                              onMenuOptionFieldChange(
                                ticketType.id,
                                group.id,
                                option.id,
                                "label",
                                event.target.value,
                              )
                            }
                            fullWidth
                          />

                          <TextField
                            label="ID opcion"
                            value={option.optionId}
                            onChange={(event) =>
                              onMenuOptionFieldChange(
                                ticketType.id,
                                group.id,
                                option.id,
                                "optionId",
                                event.target.value,
                              )
                            }
                            sx={{ minWidth: 160 }}
                          />

                          <TextField
                            label="Recargo"
                            type="number"
                            value={option.extraPrice}
                            onChange={(event) =>
                              onMenuOptionFieldChange(
                                ticketType.id,
                                group.id,
                                option.id,
                                "extraPrice",
                                event.target.value,
                              )
                            }
                            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                            sx={{ minWidth: 140 }}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={option.isActive}
                                onChange={(event) =>
                                  onMenuOptionFieldChange(
                                    ticketType.id,
                                    group.id,
                                    option.id,
                                    "isActive",
                                    event.target.checked,
                                  )
                                }
                              />
                            }
                            label="Activa"
                          />

                          <IconButton
                            onClick={() =>
                              onRemoveMenuOption(ticketType.id, group.id, option.id)
                            }
                            aria-label={`Eliminar opcion ${optionIndex + 1}`}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={ticketType.isPromotional}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "isPromotional",
                  event.target.checked,
                )
              }
            />
          }
          label="Ticket promocional"
        />

        {ticketType.isPromotional && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <TextField
              label="Cantidad minima promo"
              type="number"
              value={ticketType.promoMinQuantity}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "promoMinQuantity",
                  event.target.value,
                )
              }
              slotProps={{ htmlInput: { min: 2, step: 1 } }}
              fullWidth
            />

            <TextField
              label="Precio por bloque promo"
              type="number"
              value={ticketType.promoBundlePrice}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "promoBundlePrice",
                  event.target.value,
                )
              }
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              fullWidth
            />
          </Stack>
        )}

        <Divider />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>Cupos por dia</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onAddDailyStock(ticketType.id)}
          >
            Agregar dia
          </Button>
        </Stack>

        <Stack spacing={1}>
          {ticketType.dailyStocks.map((dailyStock, dailyStockIndex) => (
            <Stack
              key={dailyStock.id}
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ md: "center" }}
            >
              <CustomCalendarV2
                label={`Dia ${dailyStockIndex + 1}`}
                placeholder="Selecciona fecha"
                initialDate={parseLocalDateString(dailyStock.date) ?? undefined}
                availableDates={availableDateKeys}
                onSave={(date) => {
                  onDailyStockFieldChange(
                    ticketType.id,
                    dailyStock.id,
                    "date",
                    date ? toLocalDateString(date) : "",
                  );
                }}
              />

              <TextField
                label="Cantidad"
                type="number"
                value={dailyStock.quantity}
                onChange={(event) =>
                  onDailyStockFieldChange(
                    ticketType.id,
                    dailyStock.id,
                    "quantity",
                    event.target.value,
                  )
                }
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
                sx={{ minWidth: 160 }}
              />

              <IconButton
                onClick={() => onRemoveDailyStock(ticketType.id, dailyStock.id)}
                aria-label={`Eliminar cupo del dia ${dailyStockIndex + 1}`}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

export const EventsTicketsView = () => {
  const openSnackbar = useSnackBarResponseStore((state) => state.openSnackbar);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<EventWizardStep>(0);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(createInitialEventForm);

  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState<EventFilterStatus>("ALL");

  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
  const [ticketsModalEventId, setTicketsModalEventId] = useState<string | null>(null);

  const [ticketStatusFilter, setTicketStatusFilter] =
    useState<TicketFilterStatus>("ALL");
  const [ticketAttendanceDateFilter, setTicketAttendanceDateFilter] = useState("");

  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState<TicketFormState>(
    createInitialTicketForm(null),
  );

  const eventsQuery = useEventsQuery({
    status: eventStatusFilter === "ALL" ? undefined : eventStatusFilter,
    search: eventSearch.trim() || undefined,
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const [sortReferenceNowMs, setSortReferenceNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setSortReferenceNowMs(Date.now());
    }, 60_000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort((left, right) => {
      const leftDistance = new Date(left.startsAt).getTime() - sortReferenceNowMs;
      const rightDistance = new Date(right.startsAt).getTime() - sortReferenceNowMs;
      const leftIsFuture = leftDistance >= 0;
      const rightIsFuture = rightDistance >= 0;

      if (leftIsFuture && rightIsFuture) {
        return leftDistance - rightDistance;
      }

      if (leftIsFuture !== rightIsFuture) {
        return leftIsFuture ? -1 : 1;
      }

      return Math.abs(leftDistance) - Math.abs(rightDistance);
    });
  }, [events, sortReferenceNowMs]);

  const ticketsModalEvent = useMemo(() => {
    if (!ticketsModalEventId) {
      return null;
    }

    return events.find((eventItem) => eventItem.id === ticketsModalEventId) ?? null;
  }, [events, ticketsModalEventId]);

  const ticketsQuery = useEventTicketsQuery(
    ticketsModalEventId ?? undefined,
    {
      status: ticketStatusFilter === "ALL" ? undefined : ticketStatusFilter,
      attendanceDate: ticketAttendanceDateFilter || undefined,
    },
    Boolean(isTicketsModalOpen && ticketsModalEventId),
  );

  const tickets = ticketsQuery.data ?? [];

  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const deleteEventMutation = useDeleteEventMutation();

  const createEventTicketMutation = useCreateEventTicketMutation();
  const updateEventTicketMutation = useUpdateEventTicketMutation();
  const deleteEventTicketMutation = useDeleteEventTicketMutation();

  const isEventSubmitting =
    createEventMutation.isPending ||
    updateEventMutation.isPending ||
    deleteEventMutation.isPending;

  const isTicketSubmitting =
    createEventTicketMutation.isPending ||
    updateEventTicketMutation.isPending ||
    deleteEventTicketMutation.isPending;

  const eventFormAvailableDates = useMemo(() => {
    if (!eventForm.startsAtDate || !eventForm.endsAtDate) {
      return undefined;
    }

    return buildDateRangeKeys(eventForm.startsAtDate, eventForm.endsAtDate);
  }, [eventForm.startsAtDate, eventForm.endsAtDate]);

  const ticketsModalEventAvailableDates = useMemo(() => {
    if (!ticketsModalEvent) {
      return undefined;
    }

    return buildDateRangeKeys(ticketsModalEvent.startsAt, ticketsModalEvent.endsAt);
  }, [ticketsModalEvent]);

  const selectedTicketType = useMemo(() => {
    if (!ticketsModalEvent) {
      return null;
    }

    return (
      ticketsModalEvent.ticketTypes.find(
        (ticketType) => ticketType.id === ticketForm.ticketTypeId,
      ) ?? null
    );
  }, [ticketsModalEvent, ticketForm.ticketTypeId]);

  const promotionPreview = useMemo(() => {
    if (!selectedTicketType || Boolean(editingTicketId)) {
      return null;
    }

    return buildPromotionPayload(
      selectedTicketType,
      ticketForm.quantity,
      ticketForm.applyPromotion,
    );
  }, [
    editingTicketId,
    selectedTicketType,
    ticketForm.applyPromotion,
    ticketForm.quantity,
  ]);

  const buildMenuSelectionByTemplate = (
    menuTemplate?: EventTicketMenuTemplate | null,
    currentSelection?: Record<string, string[]>,
  ): Record<string, string[]> => {
    const selectionByGroup: Record<string, string[]> = {};

    for (const group of menuTemplate?.groups ?? []) {
      const activeOptionIds = new Set(
        group.options.filter((option) => option.isActive).map((option) => option.id),
      );
      const selectedOptionIds = (currentSelection?.[group.key] ?? []).filter((optionId) =>
        activeOptionIds.has(optionId),
      );

      selectionByGroup[group.key] = selectedOptionIds;
    }

    return selectionByGroup;
  };

  const resetEventWizard = () => {
    setEditingEventId(null);
    setWizardStep(0);
    setEventForm(createInitialEventForm());
  };

  const openCreateEventModal = () => {
    resetEventWizard();
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    resetEventWizard();
  };

  const resetTicketForm = (targetEvent: VenueEvent | null) => {
    setEditingTicketId(null);
    setTicketForm(createInitialTicketForm(targetEvent));
  };

  const openTicketsModalForEvent = (eventItem: VenueEvent) => {
    if (eventItem.isFreeEntry) {
      return;
    }

    setTicketsModalEventId(eventItem.id);
    setTicketStatusFilter("ALL");
    setTicketAttendanceDateFilter("");
    resetTicketForm(eventItem);
    setIsTicketsModalOpen(true);
  };

  const closeTicketsModal = () => {
    setIsTicketsModalOpen(false);
    setTicketsModalEventId(null);
    setTicketStatusFilter("ALL");
    setTicketAttendanceDateFilter("");
    resetTicketForm(null);
  };

  const updateTicketTypeDraft = (
    ticketTypeId: string,
    updater: (ticketType: TicketTypeDraft) => TicketTypeDraft,
  ) => {
    setEventForm((previous) => ({
      ...previous,
      ticketTypes: previous.ticketTypes.map((ticketType) => {
        if (ticketType.id !== ticketTypeId) {
          return ticketType;
        }

        return updater(ticketType);
      }),
    }));
  };

  const handleAddTicketType = () => {
    setEventForm((previous) => ({
      ...previous,
      ticketTypes: [...previous.ticketTypes, createEmptyTicketType()],
    }));
  };

  const handleRemoveTicketType = (ticketTypeId: string) => {
    setEventForm((previous) => {
      const nextTicketTypes = previous.ticketTypes.filter(
        (ticketType) => ticketType.id !== ticketTypeId,
      );

      if (nextTicketTypes.length > 0) {
        return {
          ...previous,
          ticketTypes: nextTicketTypes,
        };
      }

      return {
        ...previous,
        ticketTypes: [createEmptyTicketType()],
      };
    });
  };

  const handleAddDailyStock = (ticketTypeId: string) => {
    const firstAllowedDate = eventFormAvailableDates?.[0] ?? getTodayDate();

    updateTicketTypeDraft(ticketTypeId, (ticketType) => ({
      ...ticketType,
      dailyStocks: [...ticketType.dailyStocks, createEmptyDailyStock(firstAllowedDate)],
    }));
  };

  const handleTicketTypeFieldChange = (
    ticketTypeId: string,
    field: keyof Omit<TicketTypeDraft, "id" | "dailyStocks" | "menuTemplate">,
    value: string | boolean,
  ) => {
    updateTicketTypeDraft(ticketTypeId, (ticketType) => {
      const updatedTicketType = {
        ...ticketType,
        [field]: value,
      } as TicketTypeDraft;

      if (field === "isPromotional" && value === false) {
        updatedTicketType.promoMinQuantity = "2";
        updatedTicketType.promoBundlePrice = "";
      }

       if (field === "menuMode" && value === "CUSTOMIZABLE") {
         if (updatedTicketType.menuTemplate.groups.length === 0) {
           updatedTicketType.menuTemplate = createDefaultMenuTemplateDraft();
         }
       }

      return updatedTicketType;
    });
  };

  const handleAddMenuGroup = (ticketTypeId: string) => {
    updateTicketTypeMenuGroups(ticketTypeId, (groups) => [
      ...groups,
      createMenuGroupDraft(),
    ]);
  };

  const updateTicketTypeMenuGroups = (
    ticketTypeId: string,
    updater: (groups: TicketMenuGroupDraft[]) => TicketMenuGroupDraft[],
  ) => {
    updateTicketTypeDraft(ticketTypeId, (ticketType) => ({
      ...ticketType,
      menuTemplate: {
        groups: updater(ticketType.menuTemplate.groups),
      },
    }));
  };

  const handleRemoveMenuGroup = (ticketTypeId: string, groupId: string) => {
    updateTicketTypeMenuGroups(ticketTypeId, (groups) => {
      const nextGroups = groups.filter((group) => group.id !== groupId);

      return nextGroups.length > 0 ? nextGroups : [createMenuGroupDraft()];
    });
  };

  const handleMenuGroupFieldChange = (
    ticketTypeId: string,
    groupId: string,
    field: keyof Omit<TicketMenuGroupDraft, "id" | "options">,
    value: string | boolean,
  ) => {
    updateTicketTypeMenuGroups(ticketTypeId, (groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          [field]: value,
        } as TicketMenuGroupDraft;
      }),
    );
  };

  const handleAddMenuOption = (ticketTypeId: string, groupId: string) => {
    updateTicketTypeMenuGroups(ticketTypeId, (groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [...group.options, createMenuOptionDraft()],
            }
          : group,
      ),
    );
  };

  const handleRemoveMenuOption = (
    ticketTypeId: string,
    groupId: string,
    optionId: string,
  ) => {
    updateTicketTypeMenuGroups(ticketTypeId, (groups) =>
      removeMenuOptionFromGroups(groups, groupId, optionId),
    );
  };

  const handleMenuOptionFieldChange = (
    ticketTypeId: string,
    groupId: string,
    optionId: string,
    field: keyof Omit<TicketMenuOptionDraft, "id">,
    value: string | boolean,
  ) => {
    updateTicketTypeMenuGroups(ticketTypeId, (groups) =>
      updateMenuOptionInGroups(groups, groupId, optionId, field, value),
    );
  };

  const handleDailyStockFieldChange = (
    ticketTypeId: string,
    dailyStockId: string,
    field: keyof Omit<TicketDailyStockDraft, "id">,
    value: string,
  ) => {
    updateTicketTypeDraft(ticketTypeId, (ticketType) => ({
      ...ticketType,
      dailyStocks: ticketType.dailyStocks.map((dailyStock) => {
        if (dailyStock.id === dailyStockId) {
          return {
            ...dailyStock,
            [field]: value,
          };
        }

        return dailyStock;
      }),
    }));
  };

  const handleRemoveDailyStock = (ticketTypeId: string, dailyStockId: string) => {
    updateTicketTypeDraft(ticketTypeId, (ticketType) => {
      const nextDailyStocks = ticketType.dailyStocks.filter(
        (dailyStock) => dailyStock.id !== dailyStockId,
      );

      if (nextDailyStocks.length > 0) {
        return {
          ...ticketType,
          dailyStocks: nextDailyStocks,
        };
      }

      return {
        ...ticketType,
        dailyStocks: [createEmptyDailyStock(eventFormAvailableDates?.[0] ?? getTodayDate())],
      };
    });
  };

  const buildEventPayload = (): CreateVenueEventPayload | null => {
    const title = eventForm.title.trim();

    if (!title) {
      openSnackbar("Debes indicar el titulo del evento", "error");
      return null;
    }

    if (!eventForm.startsAtDate || !eventForm.startsAtTime) {
      openSnackbar("Debes completar la fecha/hora de inicio", "error");
      return null;
    }

    if (!eventForm.endsAtDate || !eventForm.endsAtTime) {
      openSnackbar("Debes completar la fecha/hora de termino", "error");
      return null;
    }

    const startsAt = toIsoDateTime(eventForm.startsAtDate, eventForm.startsAtTime);
    const endsAt = toIsoDateTime(eventForm.endsAtDate, eventForm.endsAtTime);

    if (new Date(endsAt) <= new Date(startsAt)) {
      openSnackbar("La fecha/hora de termino debe ser mayor al inicio", "error");
      return null;
    }

    const ticketTypes: EventTicketTypePayload[] = [];

    if (!eventForm.isFreeEntry) {
      for (let index = 0; index < eventForm.ticketTypes.length; index += 1) {
        const parsed = parseTicketTypePayload(
          eventForm.ticketTypes[index],
          index,
          eventForm.startsAtDate,
          eventForm.endsAtDate,
        );

        if (parsed.error) {
          openSnackbar(parsed.error, "error");
          return null;
        }

        if (parsed.payload) {
          ticketTypes.push(parsed.payload);
        }
      }

      if (ticketTypes.length === 0) {
        openSnackbar("Debes configurar al menos un tipo de ticket", "error");
        return null;
      }
    }

    return {
      title,
      description: eventForm.description.trim() || undefined,
      startsAt,
      endsAt,
      officialImageUrl: eventForm.officialImageUrl.trim() || undefined,
      status: eventForm.status,
      isFreeEntry: eventForm.isFreeEntry,
      ticketTypes,
    };
  };

  const handleSubmitEvent = async () => {
    const payload = buildEventPayload();

    if (!payload) {
      return;
    }

    if (editingEventId) {
      await updateEventMutation.mutateAsync({
        id: editingEventId,
        payload,
      });
    } else {
      await createEventMutation.mutateAsync(payload);
    }

    setIsEventModalOpen(false);
    resetEventWizard();
  };

  const loadEventToWizard = (eventItem: VenueEvent) => {
    const startsAt = toDateAndTime(eventItem.startsAt);
    const endsAt = toDateAndTime(eventItem.endsAt);

    setEditingEventId(eventItem.id);
    setWizardStep(0);
    setEventForm({
      title: eventItem.title,
      description: eventItem.description ?? "",
      startsAtDate: startsAt.date,
      startsAtTime: startsAt.time,
      endsAtDate: endsAt.date,
      endsAtTime: endsAt.time,
      officialImageUrl: eventItem.officialImageUrl ?? "",
      status: eventItem.status,
      isFreeEntry: eventItem.isFreeEntry,
      ticketTypes:
        eventItem.ticketTypes.length > 0
          ? eventItem.ticketTypes.map((ticketType) =>
              mapEventTicketTypeToDraft(ticketType, startsAt.date || getTodayDate()),
            )
          : [createEmptyTicketType()],
    });
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEventMutation.mutateAsync(eventId);

    if (ticketsModalEventId === eventId) {
      closeTicketsModal();
    }
  };

  const handleTicketTypeFormChange = (ticketTypeId: string) => {
    if (!ticketsModalEvent) {
      return;
    }

    const ticketType = ticketsModalEvent.ticketTypes.find(
      (candidate) => candidate.id === ticketTypeId,
    );

    if (!ticketType) {
      setTicketForm((previous) => ({
        ...previous,
        ticketTypeId,
        quantity: "1",
        applyPromotion: false,
        menuSelectionByGroup: {},
      }));
      return;
    }

    setTicketForm((previous) => ({
      ...previous,
      ticketTypeId,
      quantity: previous.quantity || "1",
      applyPromotion:
        ticketType.isPromotional && !editingTicketId
          ? previous.applyPromotion
          : false,
      menuSelectionByGroup: buildMenuSelectionByTemplate(
        ticketType.menuTemplate,
        previous.menuSelectionByGroup,
      ),
    }));
  };

  const handleTicketMenuSelectionChange = (
    groupKey: string,
    optionIds: string[],
  ) => {
    setTicketForm((previous) => ({
      ...previous,
      menuSelectionByGroup: {
        ...previous.menuSelectionByGroup,
        [groupKey]: optionIds,
      },
    }));
  };

  const handleSubmitTicket = async () => {
    if (!ticketsModalEvent) {
      return;
    }

    if (!ticketForm.ticketTypeId) {
      openSnackbar("Debes seleccionar un tipo de ticket", "error");
      return;
    }

    if (!selectedTicketType) {
      openSnackbar("El tipo de ticket seleccionado ya no esta disponible", "error");
      return;
    }

    const attendeeFirstName = ticketForm.attendeeFirstName.trim();
    const attendeeLastName = ticketForm.attendeeLastName.trim();

    if (!attendeeFirstName || !attendeeLastName) {
      openSnackbar("Debes indicar nombres y apellidos del asistente", "error");
      return;
    }

    if (!ticketForm.attendanceDate) {
      openSnackbar("Debes indicar fecha de asistencia", "error");
      return;
    }

    const basePayload: UpdateEventTicketPayload = {
      ticketTypeId: ticketForm.ticketTypeId,
      attendeeFirstName,
      attendeeLastName,
      attendanceDate: `${ticketForm.attendanceDate}T00:00:00`,
    };

    const menuSelectionPayload = buildTicketMenuSelectionPayload(
      selectedTicketType,
      ticketForm.menuSelectionByGroup,
    );

    if (menuSelectionPayload.error) {
      openSnackbar(menuSelectionPayload.error, "error");
      return;
    }

    if (menuSelectionPayload.payload) {
      basePayload.menuSelection = menuSelectionPayload.payload;
    }

    if (editingTicketId) {
      await updateEventTicketMutation.mutateAsync({
        eventId: ticketsModalEvent.id,
        ticketId: editingTicketId,
        payload: basePayload,
      });
    } else {
      const promotionPayload = buildPromotionPayload(
        selectedTicketType,
        ticketForm.quantity,
        ticketForm.applyPromotion,
      );

      if (promotionPayload.error) {
        openSnackbar(promotionPayload.error, "error");
        return;
      }

      await createEventTicketMutation.mutateAsync({
        eventId: ticketsModalEvent.id,
        payload: {
          ticketTypeId: basePayload.ticketTypeId ?? "",
          attendeeFirstName: basePayload.attendeeFirstName ?? "",
          attendeeLastName: basePayload.attendeeLastName ?? "",
          attendanceDate: basePayload.attendanceDate ?? "",
          quantity: promotionPayload.quantity,
          applyPromotion: promotionPayload.applyPromotion,
          menuSelection: basePayload.menuSelection,
        },
      });
    }

    resetTicketForm(ticketsModalEvent);
  };

  const handleLoadTicketToEdit = (ticket: EventTicket) => {
    const menuSelectionByGroup: Record<string, string[]> = {};

    for (const group of ticket.menuSelection?.groups ?? []) {
      menuSelectionByGroup[group.groupKey] = [...group.optionIds];
    }

    setEditingTicketId(ticket.id);
    setTicketForm({
      ticketTypeId: ticket.ticketTypeId,
      attendeeFirstName: ticket.attendeeFirstName,
      attendeeLastName: ticket.attendeeLastName,
      attendanceDate: toDateOnlyKey(ticket.attendanceDate),
      quantity: "1",
      applyPromotion: false,
      menuSelectionByGroup,
    });
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!ticketsModalEvent) {
      return;
    }

    await deleteEventTicketMutation.mutateAsync({
      eventId: ticketsModalEvent.id,
      ticketId,
    });
  };

  const renderStepContent = () => {
    if (wizardStep === 0) {
      return (
        <Stack spacing={1.5} className="event-wizard-step-content">
          <Typography variant="h6">Configuracion base del evento</Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={eventForm.isFreeEntry}
                onChange={(event) =>
                  setEventForm((previous) => ({
                    ...previous,
                    isFreeEntry: event.target.checked,
                  }))
                }
              />
            }
            label="Entrada liberada"
          />

          {eventForm.isFreeEntry && (
            <Typography variant="body2" color="text.secondary">
              Este evento no considerara tipos de ticket ni cupos por dia.
            </Typography>
          )}

          <TextField
            label="Titulo"
            value={eventForm.title}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            fullWidth
          />

          <TextField
            label="Descripcion"
            value={eventForm.description}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
            multiline
            minRows={2}
            fullWidth
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <CustomCalendarV2
              label="Fecha inicio"
              placeholder="Selecciona fecha"
              initialDate={parseLocalDateString(eventForm.startsAtDate) ?? undefined}
              onSave={(date) =>
                setEventForm((previous) => ({
                  ...previous,
                  startsAtDate: date ? toLocalDateString(date) : "",
                }))
              }
            />

            <TextField
              select
              label="Hora inicio"
              value={eventForm.startsAtTime}
              onChange={(event) =>
                setEventForm((previous) => ({
                  ...previous,
                  startsAtTime: event.target.value,
                }))
              }
              fullWidth
            >
              {TIME_OPTIONS.map((timeOption) => (
                <MenuItem key={timeOption.value} value={timeOption.value}>
                  {timeOption.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <CustomCalendarV2
              label="Fecha termino"
              placeholder="Selecciona fecha"
              initialDate={parseLocalDateString(eventForm.endsAtDate) ?? undefined}
              onSave={(date) =>
                setEventForm((previous) => ({
                  ...previous,
                  endsAtDate: date ? toLocalDateString(date) : "",
                }))
              }
            />

            <TextField
              select
              label="Hora termino"
              value={eventForm.endsAtTime}
              onChange={(event) =>
                setEventForm((previous) => ({
                  ...previous,
                  endsAtTime: event.target.value,
                }))
              }
              fullWidth
            >
              {TIME_OPTIONS.map((timeOption) => (
                <MenuItem key={timeOption.value} value={timeOption.value}>
                  {timeOption.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <TextField
              label="Imagen oficial (URL)"
              value={eventForm.officialImageUrl}
              onChange={(event) =>
                setEventForm((previous) => ({
                  ...previous,
                  officialImageUrl: event.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              select
              label="Estado inicial"
              value={eventForm.status}
              onChange={(event) =>
                setEventForm((previous) => ({
                  ...previous,
                  status: event.target.value as EventStatus,
                }))
              }
              fullWidth
            >
              {EVENT_STATUS_OPTIONS.map((statusOption) => (
                <MenuItem key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      );
    }

    if (wizardStep === 1) {
      if (eventForm.isFreeEntry) {
        return (
          <Stack spacing={1.25} className="event-wizard-step-content">
            <Typography variant="h6">Tickets y cupos</Typography>
            <Paper variant="outlined" className="event-ticket-type-card">
              <Typography>
                Este evento esta configurado como entrada liberada. No se
                definiran tipos de ticket ni cupos.
              </Typography>
            </Paper>
          </Stack>
        );
      }

      return (
        <Stack spacing={1.25} className="event-wizard-step-content">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Tipos de ticket y cupos</Typography>
            <Button startIcon={<AddIcon />} onClick={handleAddTicketType}>
              Agregar tipo
            </Button>
          </Stack>

          {eventForm.ticketTypes.map((ticketType, index) => (
            <TicketTypeEditorCard
              key={ticketType.id}
              ticketType={ticketType}
              index={index}
              availableDateKeys={eventFormAvailableDates}
              onRemoveTicketType={handleRemoveTicketType}
              onTicketTypeFieldChange={handleTicketTypeFieldChange}
              onAddDailyStock={handleAddDailyStock}
              onRemoveDailyStock={handleRemoveDailyStock}
              onDailyStockFieldChange={handleDailyStockFieldChange}
              onAddMenuGroup={handleAddMenuGroup}
              onRemoveMenuGroup={handleRemoveMenuGroup}
              onMenuGroupFieldChange={handleMenuGroupFieldChange}
              onAddMenuOption={handleAddMenuOption}
              onRemoveMenuOption={handleRemoveMenuOption}
              onMenuOptionFieldChange={handleMenuOptionFieldChange}
            />
          ))}
        </Stack>
      );
    }

    return (
      <Stack spacing={1.25} className="event-wizard-step-content">
        <Typography variant="h6">Confirmacion del evento</Typography>

        <div className="event-summary-grid">
          <article className="event-summary-card">
            <h3>{eventForm.title || "Sin titulo"}</h3>
            <p>{eventForm.description || "Sin descripcion"}</p>
            <p>
              <strong>Inicio:</strong>{" "}
              {eventForm.startsAtDate && eventForm.startsAtTime
                ? `${eventForm.startsAtDate} ${eventForm.startsAtTime}`
                : "-"}
            </p>
            <p>
              <strong>Termino:</strong>{" "}
              {eventForm.endsAtDate && eventForm.endsAtTime
                ? `${eventForm.endsAtDate} ${eventForm.endsAtTime}`
                : "-"}
            </p>
            <p>
              <strong>Estado:</strong> {EVENT_STATUS_LABEL[eventForm.status]}
            </p>
            <p>
              <strong>Imagen:</strong>{" "}
              {eventForm.officialImageUrl.trim() || "No especificada"}
            </p>
          </article>

          <article className="event-summary-card">
            <h3>Entradas</h3>

            {eventForm.isFreeEntry ? (
              <p>
                <strong>Este evento sera con entrada liberada</strong>
              </p>
            ) : (
              <>
                <p>
                  <strong>Tipos configurados:</strong> {eventForm.ticketTypes.length}
                </p>
                {eventForm.ticketTypes.map((ticketType, index) => (
                  <div key={ticketType.id} className="event-summary-ticket-item">
                    <p>
                      <strong>
                        {index + 1}. {ticketType.name || "Sin nombre"}
                      </strong>
                    </p>
                    <p>Precio: {ticketType.price || "0"}</p>
                    <p>Cupo total: {ticketType.totalStock.trim() || "No definido"}</p>
                    <p>Cupos por dia: {ticketType.dailyStocks.length}</p>
                    <p>
                      Menu: {ticketType.menuMode === "CUSTOMIZABLE" ? "Personalizable" : "Fijo"}
                    </p>
                    {ticketType.menuMode === "CUSTOMIZABLE" ? (
                      <p>Grupos de menu: {ticketType.menuTemplate.groups.length}</p>
                    ) : (
                      <p>Incluye: {ticketType.includesDetails || "No especificado"}</p>
                    )}
                    {ticketType.isPromotional && (
                      <p>
                        Promo: x{ticketType.promoMinQuantity || "2"} por{" "}
                        {ticketType.promoBundlePrice || "0"}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </article>
        </div>
      </Stack>
    );
  };

  const wizardActionLabel = editingEventId ? "Actualizar evento" : "Crear evento";

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={600}>
        Gestion de Eventos y Tickets
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
            spacing={1}
          >
            <Typography variant="h6">Eventos registrados</Typography>
            <Button variant="contained" onClick={openCreateEventModal}>
              Generar nuevo evento
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <TextField
              label="Buscar"
              value={eventSearch}
              onChange={(event) => setEventSearch(event.target.value)}
              placeholder="Titulo o descripcion"
              fullWidth
            />

            <TextField
              select
              label="Filtrar estado"
              value={eventStatusFilter}
              onChange={(event) =>
                setEventStatusFilter(event.target.value as EventFilterStatus)
              }
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              {EVENT_STATUS_OPTIONS.map((statusOption) => (
                <MenuItem key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {(eventsQuery.isLoading || eventsQuery.isFetching) && (
            <Typography color="text.secondary">Cargando eventos...</Typography>
          )}

          {!eventsQuery.isLoading && sortedEvents.length === 0 && (
            <Typography color="text.secondary">
              No hay eventos para los filtros seleccionados.
            </Typography>
          )}

          <div className="event-cards-grid">
            {sortedEvents.map((eventItem) => {
              const dailyCapacityPreview = summarizeEventDailyCapacity(eventItem).slice(0, 3);
              const availableTickets = Math.max(
                0,
                eventItem.totalTickets - eventItem.soldTickets,
              );

              return (
                <article key={eventItem.id} className="event-list-card">
                  <Stack spacing={0.7}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ md: "center" }}
                      spacing={1}
                    >
                      <Typography fontWeight={700}>{eventItem.title}</Typography>
                      <Chip
                        label={EVENT_STATUS_LABEL[eventItem.status]}
                        size="small"
                        className="event-status-chip"
                      />
                    </Stack>

                    <Typography variant="body2">
                      Inicio: {formatDateTime(eventItem.startsAt)}
                    </Typography>
                    <Typography variant="body2">
                      Termino: {formatDateTime(eventItem.endsAt)}
                    </Typography>

                    {eventItem.isFreeEntry ? (
                      <Typography variant="body2" color="text.secondary">
                        Este evento es con entrada liberada.
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2">
                          Vendidos: {eventItem.soldTickets} / {eventItem.totalTickets}
                        </Typography>
                        <Typography variant="body2">Disponibles: {availableTickets}</Typography>

                        {dailyCapacityPreview.length > 0 && (
                          <Typography variant="body2">
                            Cupos por dia:{" "}
                            {dailyCapacityPreview
                              .map(
                                ([date, quantity]) =>
                                  `${formatDateKeyLabel(date)} (${quantity})`,
                              )
                              .join(" | ")}
                          </Typography>
                        )}
                      </>
                    )}

                    {eventItem.description && (
                      <Typography variant="body2">{eventItem.description}</Typography>
                    )}

                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      className="event-card-actions"
                    >
                      {!eventItem.isFreeEntry && (
                        <Button
                          variant="contained"
                          startIcon={<ConfirmationNumberIcon />}
                          onClick={() => openTicketsModalForEvent(eventItem)}
                        >
                          Registrar tickets
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => loadEventToWizard(eventItem)}
                      >
                        Configurar
                      </Button>

                      <Button
                        variant="text"
                        color="error"
                        onClick={() => void handleDeleteEvent(eventItem.id)}
                        disabled={isEventSubmitting}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>
                </article>
              );
            })}
          </div>
        </Stack>
      </Paper>

      <Dialog open={isEventModalOpen} onClose={closeEventModal} fullWidth maxWidth="lg">
        <DialogTitle>
          {editingEventId ? "Configurar evento" : "Generar nuevo evento"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5} className="event-modal-content">
            <EventWizardProgress
              steps={WIZARD_STEPS.map((step) => step.label)}
              currentStep={wizardStep}
              onStepClick={(stepIndex) =>
                setWizardStep(Math.max(0, Math.min(2, stepIndex)) as EventWizardStep)
              }
            />

            {renderStepContent()}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={resetEventWizard}
            disabled={isEventSubmitting}
          >
            Reiniciar wizard
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            onClick={() =>
              setWizardStep((previous) => Math.max(0, previous - 1) as EventWizardStep)
            }
            disabled={wizardStep === 0 || isEventSubmitting}
          >
            Anterior
          </Button>

          <Button
            variant="outlined"
            onClick={() =>
              setWizardStep((previous) => Math.min(2, previous + 1) as EventWizardStep)
            }
            disabled={wizardStep === 2 || isEventSubmitting}
          >
            Siguiente
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleSubmitEvent()}
            disabled={isEventSubmitting}
          >
            {wizardActionLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isTicketsModalOpen && Boolean(ticketsModalEvent)}
        onClose={closeTicketsModal}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Registrar tickets</DialogTitle>

        <DialogContent dividers>
          {!ticketsModalEvent && (
            <Typography color="text.secondary">Evento no disponible.</Typography>
          )}

          {ticketsModalEvent && (
            <Stack spacing={1.25}>
              <Box className="event-ticket-header">
                <Typography fontWeight={700}>{ticketsModalEvent.title}</Typography>
                <Chip
                  label={EVENT_STATUS_LABEL[ticketsModalEvent.status]}
                  size="small"
                  className="event-status-chip"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Cupos disponibles del evento:{" "}
                {Math.max(0, ticketsModalEvent.totalTickets - ticketsModalEvent.soldTickets)}
              </Typography>

              <Divider />

              <Stack spacing={1.25}>
                <Typography fontWeight={700}>
                  {editingTicketId ? "Editar ticket" : "Registrar ticket"}
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                  <TextField
                    select
                    label="Tipo de ticket"
                    value={ticketForm.ticketTypeId}
                    onChange={(event) => handleTicketTypeFormChange(event.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">Seleccionar</MenuItem>
                    {ticketsModalEvent.ticketTypes.map((ticketType) => (
                      <MenuItem key={ticketType.id} value={ticketType.id}>
                        {ticketType.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <CustomCalendarV2
                    label="Fecha asistencia"
                    placeholder="Selecciona fecha"
                    initialDate={parseLocalDateString(ticketForm.attendanceDate) ?? undefined}
                    availableDates={ticketsModalEventAvailableDates}
                    onSave={(date) =>
                      setTicketForm((previous) => ({
                        ...previous,
                        attendanceDate: date ? toLocalDateString(date) : "",
                      }))
                    }
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                  <TextField
                    label="Nombres"
                    value={ticketForm.attendeeFirstName}
                    onChange={(event) =>
                      setTicketForm((previous) => ({
                        ...previous,
                        attendeeFirstName: event.target.value,
                      }))
                    }
                    fullWidth
                  />

                  <TextField
                    label="Apellidos"
                    value={ticketForm.attendeeLastName}
                    onChange={(event) =>
                      setTicketForm((previous) => ({
                        ...previous,
                        attendeeLastName: event.target.value,
                      }))
                    }
                    fullWidth
                  />
                </Stack>

                {!editingTicketId && selectedTicketType && (
                  <Stack spacing={0.8}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                      <TextField
                        label="Cantidad de tickets"
                        type="number"
                        value={ticketForm.quantity}
                        onChange={(event) =>
                          setTicketForm((previous) => ({
                            ...previous,
                            quantity: event.target.value,
                          }))
                        }
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                        fullWidth
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={ticketForm.applyPromotion}
                            disabled={!selectedTicketType.isPromotional}
                            onChange={(event) =>
                              setTicketForm((previous) => ({
                                ...previous,
                                applyPromotion: event.target.checked,
                              }))
                            }
                          />
                        }
                        label="Aplicar promo"
                      />
                    </Stack>

                    {selectedTicketType.isPromotional &&
                      selectedTicketType.promoMinQuantity !== null &&
                      selectedTicketType.promoBundlePrice !== null && (
                        <Typography variant="body2" color="text.secondary">
                          Promo del tipo: cada bloque de {selectedTicketType.promoMinQuantity} tickets cuesta{" "}
                          {formatCurrency(selectedTicketType.promoBundlePrice)}.
                        </Typography>
                      )}

                    {promotionPreview?.error && ticketForm.applyPromotion && (
                      <Typography variant="body2" color="error.main">
                        {promotionPreview.error}
                      </Typography>
                    )}

                    {!promotionPreview?.error &&
                      promotionPreview?.estimatedTotal !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                          Total estimado de la compra: {formatCurrency(promotionPreview.estimatedTotal)}
                        </Typography>
                      )}
                  </Stack>
                )}

                {selectedTicketType?.menuMode === "CUSTOMIZABLE" && (
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Seleccion de menu</Typography>

                    {(selectedTicketType.menuTemplate?.groups ?? []).map((group) => {
                      const activeOptions = group.options.filter((option) => option.isActive);
                      const allowMultipleSelection = group.maxSelect > 1;
                      const selectedOptionIds =
                        ticketForm.menuSelectionByGroup[group.key] ?? [];

                      return (
                        <TextField
                          key={group.key}
                          select
                          fullWidth
                          label={`${group.label}${group.required ? " *" : ""}`}
                          value={
                            allowMultipleSelection
                              ? selectedOptionIds
                              : (selectedOptionIds[0] ?? "")
                          }
                          slotProps={{
                            select: {
                              multiple: allowMultipleSelection,
                              renderValue: (selected) => {
                                const selectedIds =
                                  typeof selected === "string"
                                    ? [selected]
                                    : (selected as string[]);

                                return activeOptions
                                  .filter((option) => selectedIds.includes(option.id))
                                  .map((option) => option.label)
                                  .join(", ");
                              },
                            },
                          }}
                          helperText={`Selecciona entre ${group.minSelect} y ${group.maxSelect} opcion(es)`}
                          onChange={(event) => {
                            let selectedValues: string[];

                            if (allowMultipleSelection) {
                              if (typeof event.target.value === "string") {
                                selectedValues = [event.target.value];
                              } else {
                                selectedValues = event.target.value as string[];
                              }
                            } else {
                              selectedValues = [String(event.target.value)];
                            }

                            handleTicketMenuSelectionChange(group.key, selectedValues);
                          }}
                        >
                          {activeOptions.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                              {option.label}
                              {option.extraPrice > 0
                                ? ` (+${formatCurrency(option.extraPrice)})`
                                : ""}
                            </MenuItem>
                          ))}
                        </TextField>
                      );
                    })}
                  </Stack>
                )}

                {selectedTicketType && (
                  <Typography variant="body2" color="text.secondary">
                    Tipo seleccionado: {selectedTicketType.name} | Precio base: {" "}
                    {formatCurrency(selectedTicketType.price)}
                    {selectedTicketType.menuMode === "CUSTOMIZABLE" &&
                      " | Menu personalizable"}
                    {selectedTicketType.isPromotional &&
                      selectedTicketType.promoMinQuantity !== null &&
                      selectedTicketType.promoBundlePrice !== null && (
                        <>
                          {" "}| Promo: x{selectedTicketType.promoMinQuantity} por{" "}
                          {formatCurrency(selectedTicketType.promoBundlePrice)}
                        </>
                      )}
                  </Typography>
                )}

                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => void handleSubmitTicket()}
                    disabled={
                      ticketsModalEvent.status !== "ENABLED" ||
                      ticketsModalEvent.isFreeEntry ||
                      isTicketSubmitting
                    }
                  >
                    {editingTicketId ? "Guardar cambios" : "Registrar ticket"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => resetTicketForm(ticketsModalEvent)}
                    disabled={isTicketSubmitting}
                  >
                    Limpiar formulario
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1.2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                  <CustomCalendarV2
                    label="Filtrar por fecha"
                    placeholder="Selecciona fecha"
                    initialDate={
                      parseLocalDateString(ticketAttendanceDateFilter) ?? undefined
                    }
                    availableDates={ticketsModalEventAvailableDates}
                    onSave={(date) => {
                      setTicketAttendanceDateFilter(date ? toLocalDateString(date) : "");
                    }}
                  />

                  <TextField
                    select
                    label="Estado ticket"
                    value={ticketStatusFilter}
                    onChange={(event) =>
                      setTicketStatusFilter(event.target.value as TicketFilterStatus)
                    }
                    sx={{ minWidth: 220 }}
                  >
                    <MenuItem value="ALL">Todos</MenuItem>
                    {TICKET_STATUS_OPTIONS.map((statusOption) => (
                      <MenuItem key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                {(ticketsQuery.isLoading || ticketsQuery.isFetching) && (
                  <Typography color="text.secondary">Cargando tickets...</Typography>
                )}

                {!ticketsQuery.isLoading && tickets.length === 0 && (
                  <Typography color="text.secondary">
                    No hay tickets para este evento con los filtros actuales.
                  </Typography>
                )}

                <div className="event-ticket-grid">
                  {tickets.map((ticket) => {
                    const ticketTypeName = ticket.ticketType?.name || "Sin tipo";

                    return (
                      <article key={ticket.id} className="event-ticket-card">
                        <h3>
                          {ticket.attendeeFirstName} {ticket.attendeeLastName}
                        </h3>
                        <p>
                          <strong>Tipo:</strong> {ticketTypeName}
                        </p>
                        <p>
                          <strong>Fecha:</strong> {toDateOnlyKey(ticket.attendanceDate)}
                        </p>
                        <p>
                          <strong>Precio:</strong> {formatCurrency(ticket.price)}
                        </p>
                        <p>
                          <strong>Estado:</strong> {TICKET_STATUS_LABEL[ticket.status]}
                        </p>

                        {ticket.menuSelectionSnapshot?.groups?.some(
                          (group) => group.selectedOptions.length > 0,
                        ) && (
                          <p>
                            <strong>Menu:</strong>{" "}
                            {ticket.menuSelectionSnapshot.groups
                              .filter((group) => group.selectedOptions.length > 0)
                              .map(
                                (group) =>
                                  `${group.groupLabel}: ${group.selectedOptions
                                    .map((option) => option.label)
                                    .join(", ")}`,
                              )
                              .join(" | ")}
                          </p>
                        )}

                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleLoadTicketToEdit(ticket)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            color="error"
                            onClick={() => void handleDeleteTicket(ticket.id)}
                            disabled={isTicketSubmitting}
                          >
                            Eliminar
                          </Button>
                        </Stack>
                      </article>
                    );
                  })}
                </div>
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeTicketsModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
