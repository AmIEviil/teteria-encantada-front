/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import DatePicker, { CalendarContainer } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";

import { useTranslation } from "react-i18next";
import { enUS, es, type Locale } from "date-fns/locale";
import i18n from "../../../i18n";
import CalendarIcon from "../Icons/CalendarIcon";
import FullArrowIcon from "../Icons/FullArrow";

// Locale config
const localeMap: Record<string, Locale> = { en: enUS, es };

// Custom input
const CustomInput = React.forwardRef<HTMLInputElement, any>(
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

// Custom calendar container
const CustomCalendarContainer = ({ children }: any) => {
  return (
    <div className="custom-calendar-wrapper">
      <CalendarContainer>
        <div
          style={{ borderTop: "none", padding: "16px", borderRadius: "8px" }}
        >
          {children}
        </div>
      </CalendarContainer>
    </div>
  );
};

// Footer buttons
const DatePickerFooter = ({
  onClear,
  onToday,
}: {
  onClear: () => void;
  onToday: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="calendar-footer">
      <button className="normal btn-footer delete" onClick={onClear}>
        {t("modules.common.erase")}
      </button>
      <button className="normal btn-footer today" onClick={onToday}>
        {t("modules.common.today")}
      </button>
    </div>
  );
};

interface CalendarProps {
  onCancel?: () => void;
  onChange?: (range: { start: Date | null; end: Date | null }) => void;
  onDelete?: () => void; // New prop for custom delete function
  mode?: "range" | "day";
  label?: string;
  initialValue?: Date | [Date, Date] | null;
  className?: string;
  buttonClassName?: string;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  required?: boolean;
}

export default function Calendar({
  onCancel,
  onChange,
  onDelete,
  mode = "range",
  label,
  initialValue,
  className,
  buttonClassName,
  minDate,
  maxDate = new Date(),
  title,
  required,
}: Readonly<CalendarProps>) {
  const { t } = useTranslation();
  const monthNames = [
    t("modules.common.months.january"),
    t("modules.common.months.february"),
    t("modules.common.months.march"),
    t("modules.common.months.april"),
    t("modules.common.months.may"),
    t("modules.common.months.june"),
    t("modules.common.months.july"),
    t("modules.common.months.august"),
    t("modules.common.months.september"),
    t("modules.common.months.october"),
    t("modules.common.months.november"),
    t("modules.common.months.december"),
  ];

  // Estado separado para cada modo
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);
  const [singleDate, setSingleDate] = useState<Date | null>(null);

  useEffect(() => {
    if (mode === "range" && Array.isArray(initialValue)) {
      setRange(initialValue);
    } else if (mode === "day") {
      // Handle both Date objects and null values
      if (initialValue instanceof Date) {
        setSingleDate(initialValue);
      } else {
        setSingleDate(null);
      }
    }
  }, [initialValue, mode]);

  // Común a ambos modos
  const renderHeader = ({
    date,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => (
    <div className={`custom-datepicker-header ${className}`}>
      <div className="custom-datepicker-selects">
        <select
          className="custom-select z-100000"
          value={date.getMonth()}
          onChange={({ target: { value } }) => changeMonth(Number(value))}
        >
          {monthNames.map((month, index) => (
            <option key={index} value={index}>
              {month} {date.getFullYear()}
            </option>
          ))}
        </select>
      </div>
      <div className="custom-arrows">
        <button
          className="normal"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
        >
          <FullArrowIcon direction="left" />
        </button>
        <button
          className="normal"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
        >
          <FullArrowIcon direction="right" />
        </button>
      </div>
    </div>
  );

  // Range mode
  if (mode === "range") {
    const clampToDay = (d: Date | null, end = false) => {
      if (!d) return null;
      const x = new Date(d);
      if (end) x.setHours(23, 59, 59, 999);
      else x.setHours(0, 0, 0, 0);
      return x;
    };

    const handleChangeRange = (update: [Date | null, Date | null]) => {
      setRange(update);

      // cuando hay ambos extremos, normalizamos a 00:00 y 23:59:59.999
      if (update[0] && update[1] && onChange) {
        const start = clampToDay(update[0], false)!;
        const end = clampToDay(update[1], true)!;
        onChange({ start, end });
      }

      if (onCancel && !update[0] && !update[1]) {
        onCancel();
      }
    };

    const handleClearRange = () => {
      handleChangeRange([null, null]);
      onDelete?.();
    };

    return (
      <div className="flex flex-col">
        {title && (
          <label className="datepicker-title text-sm font-semibold mb-2">
            {title} {required && <span className="required">*</span>}
          </label>
        )}
        <DatePicker
          selected={range[0]}
          startDate={range[0]}
          endDate={range[1]}
          selectsRange
          onChange={handleChangeRange}
          customInput={<CustomInput buttonClassName={buttonClassName} />}
          calendarContainer={CustomCalendarContainer}
          dateFormat="dd/MM/yyyy"
          minDate={minDate}
          maxDate={maxDate}
          locale={localeMap[i18n.language]}
          renderCustomHeader={renderHeader}
          placeholderText={label}
          className={className}
          value={label}
        >
          <DatePickerFooter
            onClear={handleClearRange}
            onToday={() => handleChangeRange([new Date(), new Date()])}
          />
        </DatePicker>
      </div>
    );
  }

  // Single day mode
  const handleChangeDay = (date: Date | null) => {
    setSingleDate(date);

    if (!date) {
      // Clear the date range when date is null
      onChange?.({ start: null, end: null });
      return;
    }

    onChange?.({ start: date, end: date });
  };

  const handleClearDay = () => {
    handleChangeDay(null);
    onDelete?.(); // Call the custom delete function
  };

  return (
    <div className="flex flex-col">
      {title && (
        <label className="datepicker-title text-sm font-semibold mb-2">
          {title} {required && <span className="required">*</span>}
        </label>
      )}

      <DatePicker
        selected={singleDate}
        onChange={handleChangeDay}
        customInput={<CustomInput buttonClassName={buttonClassName} />}
        calendarContainer={CustomCalendarContainer}
        dateFormat="dd/MM/yyyy"
        minDate={minDate}
        maxDate={maxDate}
        locale={localeMap[i18n.language]}
        renderCustomHeader={renderHeader}
        placeholderText={label}
        className={`${className}`}
      >
        <DatePickerFooter
          onClear={handleClearDay}
          onToday={() => handleChangeDay(new Date())}
        />
      </DatePicker>
    </div>
  );
}
