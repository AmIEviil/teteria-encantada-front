import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import MultiSelectDropdown from "../dropdown/MultipleSelectDropdown";
import style from "./FieldGroup.module.css";
import CheckIcon from "../icons/CheckIcon";
import CloseIcon from "../icons/CloseIcon";
import PencilIcon from "../icons/PencilIcon";
import CommentIcon from "../icons/CommentIcon";
import { CustomCalendarV2 } from "../calendar/CustomCalendarV2";
export interface Options {
  value: number;
  label: string;
}

export interface IObservacion {
  id_observacion: number;
  name_last_name: string;
  area: string;
  date: string;
  observacion: string;
}

interface FieldGroupProps {
  label: string;
  value?: string | number | null;
  editable?: boolean;
  commentable?: boolean;
  options?: Options[];
  type?: "string" | "number" | "hour" | "date" | "text-area" | "boolean";
  comments?: IObservacion[];
  multiple?: boolean;
  multiCheckbox?: boolean;
  rawValue?: string | number | null;
  onEdit?: (value: string | number | null | undefined) => void;
  onComment?: (value: string) => void;
}

const parseEditedDateValue = (
  editedValue: string | number | null | undefined,
): Date | null => {
  if (!editedValue) {
    return null;
  }

  if (typeof editedValue === "number") {
    return new Date(editedValue);
  }

  const parts = editedValue.split("/");
  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const FieldGroup: React.FC<FieldGroupProps> = ({
  label,
  value,
  editable,
  commentable,
  options,
  type,
  comments,
  multiple,
  multiCheckbox,
  rawValue,
  onEdit,
  // onComment,
}) => {
  const { t } = useTranslation();
  const [enableEdit, setEnableEdit] = useState(true);
  const [enableComment, setEnableComment] = useState(false);
  const [editedValue, setEditedValue] = useState<
    string | number | null | undefined
  >(value);
  const parsedEditedDate = parseEditedDateValue(editedValue);
  const isOptionSelected = (
    currentValue: string | number | null | undefined,
    optionLabel: string,
  ) => String(currentValue ?? "") === optionLabel;

  // const { setIsEditing, setIsCommenting } = useActionsStore();
  // const { isFormDetailCommentable } = useFormDetailsStore();

  // Cada vez que cambie la prop `value` desde fuera, sincronizamos el estado interno
  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const handleClickComment = () => {
    // setIsCommenting(true);
    setEnableComment(!enableComment);
  };

  const handleClickEdit = () => {
    // setIsEditing(true);
    setEnableEdit(false); // siempre entra en modo edición
  };

  const handleConfirmEdit = () => {
    if (onEdit && editedValue !== value) {
      onEdit(editedValue);
    }
    setEnableEdit(true);
    // setIsEditing(false); // Solo una llamada final
  };

  const handleCancelEdit = () => {
    setEnableEdit(true);
    // setIsEditing(false);
  };

  useEffect(() => {
    // Si es multiCheckbox preferimos rawValue (string db como "0,1") si está disponible
    if (multiCheckbox) {
      if (
        rawValue !== undefined &&
        rawValue !== null &&
        String(rawValue) !== ""
      ) {
        setEditedValue(String(rawValue));
        return;
      }
      // fallback: value viene como labels => convertir a values
      if (typeof value === "string") {
        // const parsed = parseLabelsToValues(value, options);
        setEditedValue(value); // parsed;
        return;
      }
      setEditedValue("");
      return;
    }
    if (value !== editedValue) {
      setEditedValue(value);
    }
  }, [value, rawValue, options, multiCheckbox, editedValue]);

  return (
    <div style={{ marginBottom: "0.75rem", width: "100%" }}>
      <label style={{ fontWeight: "bold", display: "block" }}>{label}</label>
      <span className="flex flex-inline justify-between">
        {enableEdit ? (
          <div className={`${style.fieldValue} custom-scrollbar`}>
            {value ?? "--"}
          </div>
        ) : (
          <div className="flex flex-row justify-between w-full gap-2">
            <div className="flex flex-row flex-wrap gap-4 items-center w-full justify-start">
              {options && options.length > 0 && (
                <>
                  {multiple ? (
                    <MultiSelectDropdown
                      options={options}
                      value={String(editedValue)}
                      onSelect={(value) => setEditedValue(value)}
                      arrowType="arrow"
                    />
                  ) : multiCheckbox ? (
                    options?.map((option) => {
                      const currentValues = editedValue
                        ? String(editedValue).split(",")
                        : [];
                      const isChecked = currentValues.includes(
                        String(option.value)
                      );

                      return (
                        <div
                          key={option.value}
                          className="flex flex-row justify-items-start items-center"
                        >
                          <input
                            id={`${label}-${option.value}`}
                            type="checkbox"
                            name={label}
                            value={option.value}
                            checked={isChecked}
                            onChange={(e) => {
                              let newValues = [...currentValues];
                              if (e.target.checked) {
                                if (!newValues.includes(String(option.value))) {
                                  newValues.push(String(option.value));
                                }
                              } else {
                                newValues = newValues.filter(
                                  (val) => val !== String(option.value)
                                );
                              }
                              setEditedValue(newValues.join(","));
                            }}
                          />
                          <label
                            htmlFor={`${label}-${option.value}`}
                            className="ml-2"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    options.map((option) => (
                      <div
                        key={option.value}
                        className="flex flex-row justify-items-start items-center"
                      >
                        <input
                          id={`${label}-${option.value}`}
                          type="radio"
                          name={label}
                          // mapLabelToDb
                          value={option.label ?? ""}
                          checked={isOptionSelected(editedValue, option.label)}
                          onChange={(e) => setEditedValue(e.target.value)}
                        />
                        <label
                          htmlFor={`${label}-${option.value}`}
                          className="ml-2"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))
                  )}
                </>
              )}
              {options?.length === 0 && type === "string" && (
                <input
                  className="border border-gray-300 rounded-md p-2 w-full"
                  type="text"
                  value={String(editedValue)}
                  onChange={(e) => setEditedValue(e.target.value)}
                />
              )}
              {options?.length === 0 && type === "number" && (
                <input
                  className="border border-gray-300 rounded-md p-2 w-full"
                  type="number"
                  value={Number(editedValue)}
                  onChange={(e) => setEditedValue(e.target.value)}
                />
              )}
              {options?.length === 0 && type === "hour" && (
                <input
                  className="border border-gray-300 rounded-md p-2"
                  type="time"
                  value={String(editedValue)}
                  onChange={(e) => {
                    const newHour = e.target.value; // "10:30"
                    // reconstruyes la fecha original con la nueva hora
                    setEditedValue(() => newHour);
                  }}
                />
              )}
              {options?.length === 0 && type === "date" && (
                <CustomCalendarV2
                  label={label}
                  initialDate={parsedEditedDate ?? undefined}
                  onSave={(selectedDate) => {
                    setEditedValue(selectedDate ? selectedDate.getTime() : null);
                  }}
                />
              )}
              {options?.length === 0 && type === "text-area" && (
                <textarea
                  className="border border-gray-300 rounded-md p-2 w-full custom-scrollbar"
                  value={String(editedValue)}
                  onChange={(e) => setEditedValue(e.target.value)}
                />
              )}
              {options?.length === 0 && !type && (
                <span>{t("modules.common.no_options")}</span>
              )}
            </div>
            <div className="flex flex-row gap-1 justify-center items-center">
              <button
                className="bg-[#F7F7F7] p-1 rounded-lg"
                onClick={handleConfirmEdit}
              >
                <CheckIcon size={28} color="black" />
              </button>
              <button onClick={handleCancelEdit}>
                <CloseIcon size={24} color="black" />
              </button>
            </div>
          </div>
        )}
        {enableComment ||
          (enableEdit && (
            <div className="flex gap-4">
              {editable && (
                <button onClick={handleClickEdit}>
                  <PencilIcon />
                </button>
              )}
              {commentable && !comments?.length && (
                <button onClick={handleClickComment}>
                  <CommentIcon />
                </button>
              )}
            </div>
          ))}
      </span>
      {/* <MultiCommentsField
        comments={comments!}
        onComment={onComment!}
        shouldEnableComment={isFormDetailCommentable}
        enableComment={enableComment}
        setEnableComment={setEnableComment}
      /> */}
    </div>
  );
};

export default FieldGroup;
