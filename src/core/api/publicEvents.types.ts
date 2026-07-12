import type {
  EventTicketMenuMode,
  EventTicketMenuTemplate,
  EventTicketMenuSelection,
} from "./types";

export interface PublicEventDetailTicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  includesDetails: string | null;
  menuMode: EventTicketMenuMode;
  menuTemplate: EventTicketMenuTemplate | null;
  available: boolean;
  remaining: number | null;
}

export interface PublicEventDetailSessionTicketType {
  ticketTypeId: string;
  available: boolean;
  remaining: number | null;
}

export interface PublicEventDetailSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  name: string | null;
  available: boolean;
  remaining: number | null;
  ticketTypes: PublicEventDetailSessionTicketType[];
}

export interface PublicEventDetail {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  officialImageUrl: string | null;
  isFreeEntry: boolean;
  hasSessions: boolean;
  ticketTypes: PublicEventDetailTicketType[];
  sessions: PublicEventDetailSession[];
}

export interface PublicPurchaseItem {
  ticketTypeId: string;
  sessionId?: string;
  attendanceDate?: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  menuSelection?: EventTicketMenuSelection;
}

export interface PublicPurchasePayload {
  buyerEmail: string;
  items: PublicPurchaseItem[];
}

export interface PublicPurchaseTicket {
  id: string;
  ticketTypeName: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  attendanceDate: string;
  sessionId: string | null;
  price: number;
  menuExtraPrice: number;
  includesDetails: string | null;
  menuSummary: string | null;
}

export interface PublicPurchaseResult {
  eventId: string;
  eventTitle: string;
  buyerEmail: string;
  tickets: PublicPurchaseTicket[];
  total: number;
}
