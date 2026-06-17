import type {
  EventStatus,
  EventTicketStatus,
  EventTicketMenuMode,
} from "../../core/api/types";

export type EventFilterStatus = EventStatus | "ALL";
export type TicketFilterStatus = EventTicketStatus | "ALL";
export type EventWizardStep = 0 | 1 | 2;

export interface TicketDailyStockDraft {
  id: string;
  date: string;
  quantity: string;
}

export interface TicketMenuOptionDraft {
  id: string;
  optionId: string;
  label: string;
  extraPrice: string;
  isActive: boolean;
}

export interface TicketMenuGroupDraft {
  id: string;
  key: string;
  label: string;
  required: boolean;
  minSelect: string;
  maxSelect: string;
  options: TicketMenuOptionDraft[];
}

export interface TicketMenuTemplateDraft {
  groups: TicketMenuGroupDraft[];
}

export interface TicketTypeDraft {
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

export interface EventFormState {
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

export interface TicketFormState {
  ticketTypeId: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  attendanceDate: string;
  quantity: string;
  applyPromotion: boolean;
  menuSelectionByGroup: Record<string, string[]>;
}

export interface TicketTypeEditorCardProps {
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
