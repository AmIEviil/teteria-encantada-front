/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useTranslation } from "react-i18next";
import CalendarIcon from "../../icons/CalendarIcon";

export const CustomInput = React.forwardRef<HTMLInputElement, any>(
  ({ value, onClick, buttonClassName }, ref) => {
    const { t } = useTranslation();

    return (
      <button
        className={`custom-date-button font-normal bg-[#FAFBFC] ${buttonClassName}`}
        onClick={onClick}
        ref={ref as React.RefObject<HTMLButtonElement>}
      >
        {value && typeof value === "string" && value !== "Invalid Date"
          ? value
          : t("modules.common.select_date")}
        <CalendarIcon size={16} />
      </button>
    );
  },
);
CustomInput.displayName = "CustomInput";
