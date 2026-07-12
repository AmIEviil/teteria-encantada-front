import type { CartItem } from "../../../../store/purchaseStore";
import type { EventTicketMenuSelection } from "../../../../core/api/types";
import type { PublicEventDetailTicketType } from "../../../../core/api/publicEvents.types";

export interface AttendeeDraft {
  id: string;
  firstName: string;
  lastName: string;
  ticketTypeId: string;
  menuByGroup: Record<string, string[]>; // groupKey -> optionIds
}

const activeGroups = (ticketType: PublicEventDetailTicketType) =>
  ticketType.menuMode === "CUSTOMIZABLE" && ticketType.menuTemplate
    ? ticketType.menuTemplate.groups
    : [];

export const isAttendeeDraftValid = (
  draft: AttendeeDraft,
  ticketType: PublicEventDetailTicketType | undefined,
): boolean => {
  if (!ticketType) return false;
  if (!draft.firstName.trim() || !draft.lastName.trim()) return false;
  for (const group of activeGroups(ticketType)) {
    const selected = draft.menuByGroup[group.key] ?? [];
    const min = group.required ? Math.max(1, group.minSelect ?? 1) : group.minSelect ?? 0;
    if (selected.length < min) return false;
    if (group.maxSelect && selected.length > group.maxSelect) return false;
  }
  return true;
};

export const menuExtraForDraft = (
  draft: AttendeeDraft,
  ticketType: PublicEventDetailTicketType | undefined,
): number => {
  if (!ticketType) return 0;
  let extra = 0;
  for (const group of activeGroups(ticketType)) {
    const selected = draft.menuByGroup[group.key] ?? [];
    for (const opt of group.options) {
      if (selected.includes(opt.id)) extra += opt.extraPrice ?? 0;
    }
  }
  return extra;
};

const buildMenuSelection = (
  draft: AttendeeDraft,
  ticketType: PublicEventDetailTicketType,
): EventTicketMenuSelection | undefined => {
  const groups = activeGroups(ticketType)
    .map((group) => ({
      groupKey: group.key,
      optionIds: draft.menuByGroup[group.key] ?? [],
    }))
    .filter((g) => g.optionIds.length > 0);
  return groups.length ? { groups } : undefined;
};

const newId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()}`;

export const buildCartItem = (
  draft: AttendeeDraft,
  ticketType: PublicEventDetailTicketType,
): CartItem => ({
  id: newId(),
  ticketTypeId: ticketType.id,
  ticketTypeName: ticketType.name,
  attendeeFirstName: draft.firstName.trim(),
  attendeeLastName: draft.lastName.trim(),
  menuSelection: buildMenuSelection(draft, ticketType),
  unitPrice: ticketType.price,
  menuExtraPrice: menuExtraForDraft(draft, ticketType),
});
