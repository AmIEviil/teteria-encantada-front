import CustomInputText from "../../../ui/InputText/CustomInputText";
import CustomSelect from "../../../ui/Select/Select";
import { formatMoneyNumber } from "../../../../utils/formatText.utils";
import type { PublicEventDetailTicketType } from "../../../../core/api/publicEvents.types";
import type { AttendeeDraft } from "./attendee.utils";

interface AttendeeFormProps {
  index: number;
  draft: AttendeeDraft;
  ticketTypes: PublicEventDetailTicketType[];
  onChange: (draft: AttendeeDraft) => void;
  onRemove?: () => void;
}

// ponytail: sin libs de validación; letras + espacios y separadores de nombre (O'Brien, Jean-Luc).
const onlyLetters = (value: string) => value.replace(/[^\p{L}\s'-]/gu, "");

export const AttendeeForm = ({
  index,
  draft,
  ticketTypes,
  onChange,
  onRemove,
}: AttendeeFormProps) => {
  const selectedType = ticketTypes.find((t) => t.id === draft.ticketTypeId);
  const menuGroups =
    selectedType?.menuMode === "CUSTOMIZABLE" && selectedType.menuTemplate
      ? selectedType.menuTemplate.groups
      : [];

  const toggleOption = (
    groupKey: string,
    optionId: string,
    maxSelect: number,
  ) => {
    const current = draft.menuByGroup[groupKey] ?? [];
    let next: string[];
    if (current.includes(optionId)) {
      next = current.filter((id) => id !== optionId);
    } else if (maxSelect === 1) {
      next = [optionId];
    } else if (current.length < maxSelect) {
      next = [...current, optionId];
    } else {
      next = current;
    }
    onChange({
      ...draft,
      menuByGroup: { ...draft.menuByGroup, [groupKey]: next },
    });
  };

  return (
    <div className="publicAttendeeCard">
      <div className="publicAttendeeHeader">
        <strong>Persona {index + 1}</strong>
        {onRemove && (
          <button type="button" className="publicLinkButton" onClick={onRemove}>
            Quitar
          </button>
        )}
      </div>

      <div className="publicAttendeeGrid">
        <CustomInputText
          title="Nombre"
          require
          value={draft.firstName}
          onChange={(v) => onChange({ ...draft, firstName: onlyLetters(v) })}
          type="text"
        />
        <CustomInputText
          title="Apellido"
          require
          value={draft.lastName}
          onChange={(v) => onChange({ ...draft, lastName: onlyLetters(v) })}
          type="text"
        />
      </div>

      <div className="mt-4">
        <CustomSelect
          title="Opción de ticket"
          required
          label="Selecciona un ticket"
          value={draft.ticketTypeId}
          options={ticketTypes.map((t) => ({
            value: t.id,
            label: `${t.name} — ${formatMoneyNumber(t.price)}`,
          }))}
          onChange={(e) =>
            onChange({
              ...draft,
              ticketTypeId: String(e.target.value),
              menuByGroup: {},
            })
          }
        />
      </div>

      {menuGroups.map((group) => (
        <fieldset className="publicMenuGroup" key={group.key}>
          <legend>
            {group.label}
            {group.required ? " *" : ""}{" "}
            <span className="publicMuted">(elige {group.maxSelect ?? 1})</span>
          </legend>
          {group.options
            .filter((o) => o.isActive)
            .map((option) => {
              const selected = (draft.menuByGroup[group.key] ?? []).includes(
                option.id,
              );
              return (
                <label key={option.id} className="publicMenuOption">
                  <input
                    type={group.maxSelect === 1 ? "radio" : "checkbox"}
                    name={`${draft.id}-${group.key}`}
                    checked={selected}
                    onChange={() =>
                      toggleOption(group.key, option.id, group.maxSelect ?? 1)
                    }
                  />
                  <span>
                    {option.label}
                    {option.extraPrice
                      ? ` (+${formatMoneyNumber(option.extraPrice)})`
                      : ""}
                  </span>
                </label>
              );
            })}
        </fieldset>
      ))}
    </div>
  );
};
