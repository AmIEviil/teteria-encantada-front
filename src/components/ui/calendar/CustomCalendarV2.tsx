import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, IconButton } from "@mui/material";
import styles from "./CustomCalendarV2.module.css";

interface CustomCalendarV2Props {
  label?: string;
  placeholder?: string;
  initialDate?: Date;
  availableDates?: string[];
  disabled?: boolean;
  styleVariant?: "default" | "teteria";
  showLabel?: boolean;
  onSave?: (date: Date | null) => void;
  onCancel?: () => void;
}

interface MonthCell {
  day: number | null;
  key: string;
}

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const normalizeDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string) => {
  const normalized = value.trim();

  const yyyyMmDdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (yyyyMmDdMatch) {
    const [, year, month, day] = yyyyMmDdMatch;
    return `${year}-${month}-${day}`;
  }

  const ddMmYyyyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateKey(parsed);
};

const dateFromDateKey = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const getMonthLabel = (date: Date) => {
  const month = date.toLocaleString("es-CL", { month: "short" });
  const shortMonth = month.replace(".", "");
  return `${shortMonth.charAt(0).toUpperCase()}${shortMonth.slice(1)} ${date.getFullYear()}`;
};

const formatDateLabel = (value: Date) => {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
};

export const CustomCalendarV2 = ({
  label = "Fecha",
  placeholder,
  initialDate,
  availableDates,
  disabled = false,
  styleVariant = "teteria",
  showLabel = true,
  onSave,
  onCancel,
}: CustomCalendarV2Props) => {
  const resolvedPlaceholder =
    placeholder ?? (showLabel ? "Selecciona una fecha" : "seleccione fecha");

  const variantClassName =
    styleVariant === "default" ? styles.variantDefault : styles.variantTeteria;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLElement>(null);
  const allowedDateKeys = useMemo(() => {
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      return null;
    }

    const parsedDates = availableDates
      .map(parseDateKey)
      .filter((key): key is string => Boolean(key));

    if (parsedDates.length === 0) {
      return null;
    }

    return new Set(parsedDates);
  }, [availableDates]);

  const firstAllowedDate = useMemo(() => {
    if (!allowedDateKeys || allowedDateKeys.size === 0) {
      return null;
    }

    const sortedKeys = Array.from(allowedDateKeys).sort((left, right) =>
      left.localeCompare(right),
    );
    return dateFromDateKey(sortedKeys[0]);
  }, [allowedDateKeys]);

  const lastAllowedDate = useMemo(() => {
    if (!allowedDateKeys || allowedDateKeys.size === 0) {
      return null;
    }

    const sortedKeys = Array.from(allowedDateKeys).sort((left, right) =>
      left.localeCompare(right),
    );
    return dateFromDateKey(sortedKeys.at(-1) ?? "");
  }, [allowedDateKeys]);

  const startingDate = useMemo(
    () => {
      if (!initialDate) {
        return null;
      }

      const normalizedInitialDate = normalizeDate(initialDate);
      if (!allowedDateKeys) {
        return normalizedInitialDate;
      }

      return allowedDateKeys.has(toDateKey(normalizedInitialDate))
        ? normalizedInitialDate
        : null;
    },
    [initialDate, allowedDateKeys],
  );

  const [internalSavedDate, setInternalSavedDate] = useState<Date | null>(startingDate);

  const savedDate = initialDate === undefined ? internalSavedDate : startingDate;

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const baseDate = savedDate ?? firstAllowedDate ?? new Date();
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  });

  const [draftDate, setDraftDate] = useState<Date | null>(savedDate);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
    width: 280,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideWrapper = !wrapperRef.current?.contains(target);
      const isOutsidePopup = !popupRef.current?.contains(target);

      if (isOutsideWrapper && isOutsidePopup) {
        setDraftDate(savedDate);
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, savedDate]);

  const updatePopupPosition = () => {
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const baseWidth = rect.width > 0 ? rect.width : 280;
    const popupWidth = Math.max(Math.min(baseWidth, 320), 250);
    const viewportWidth = globalThis.innerWidth;
    const viewportHeight = globalThis.innerHeight;

    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + popupWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - popupWidth - 8);
    }

    const estimatedHeight = 360;
    if (top + estimatedHeight > viewportHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 8);
    }

    setPopupPosition({
      top,
      left,
      width: popupWidth,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const frameId = globalThis.requestAnimationFrame(() => {
      updatePopupPosition();
    });

    const handleScroll = () => updatePopupPosition();
    const handleResize = () => updatePopupPosition();

    globalThis.addEventListener("scroll", handleScroll, true);
    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.cancelAnimationFrame(frameId);
      globalThis.removeEventListener("scroll", handleScroll, true);
      globalThis.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const monthDays = useMemo<MonthCell[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: MonthCell[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, key: `empty-start-${year}-${month}-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, key: `day-${year}-${month}-${day}` });
    }

    let trailingIndex = 0;
    while (days.length % 7 !== 0) {
      days.push({
        day: null,
        key: `empty-end-${year}-${month}-${trailingIndex}`,
      });
      trailingIndex++;
    }

    return days;
  }, [currentMonth]);

  const openCalendar = () => {
    if (disabled) {
      return;
    }

    const baseDate = savedDate ?? firstAllowedDate ?? new Date();
    setCurrentMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setDraftDate(savedDate);
    setIsOpen(true);

    globalThis.requestAnimationFrame(() => {
      updatePopupPosition();
    });
  };

  const formattedSavedDate = useMemo(() => {
    if (!savedDate) {
      return "";
    }
    return formatDateLabel(savedDate);
  }, [savedDate]);

  const canGoToPreviousMonth = useMemo(() => {
    if (!firstAllowedDate) {
      return true;
    }

    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const firstAllowedMonthStart = new Date(
      firstAllowedDate.getFullYear(),
      firstAllowedDate.getMonth(),
      1,
    );

    return currentMonthStart > firstAllowedMonthStart;
  }, [currentMonth, firstAllowedDate]);

  const canGoToNextMonth = useMemo(() => {
    if (!lastAllowedDate) {
      return true;
    }

    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastAllowedMonthStart = new Date(
      lastAllowedDate.getFullYear(),
      lastAllowedDate.getMonth(),
      1,
    );

    return currentMonthStart < lastAllowedMonthStart;
  }, [currentMonth, lastAllowedDate]);

  const goToPreviousMonth = () => {
    if (!canGoToPreviousMonth) {
      return;
    }

    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    if (!canGoToNextMonth) {
      return;
    }

    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleCancel = () => {
    setDraftDate(savedDate);
    setIsOpen(false);
    onCancel?.();
  };

  const handleSave = () => {
    const shouldKeepDraftDate =
      !allowedDateKeys ||
      !draftDate ||
      allowedDateKeys.has(toDateKey(draftDate));

    const dateToSave = shouldKeepDraftDate ? draftDate : null;

    if (initialDate === undefined) {
      setInternalSavedDate(dateToSave);
    }

    setIsOpen(false);
    onSave?.(dateToSave);
  };

  const isSelectedDay = (day: number) => {
    if (!draftDate) {
      return false;
    }

    return (
      draftDate.getDate() === day &&
      draftDate.getMonth() === currentMonth.getMonth() &&
      draftDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isDisabledDay = (day: number) => {
    if (!allowedDateKeys) {
      return false;
    }

    const dayDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    return !allowedDateKeys.has(toDateKey(dayDate));
  };

  return (
    <section className={`${styles.wrapper} ${variantClassName}`} ref={wrapperRef}>
      {showLabel && <label className={styles.label}>{label}</label>}
      <button
        type="button"
        className={`${styles.inputField} ${isOpen ? styles.inputOpen : ""}`}
        onClick={openCalendar}
        disabled={disabled}
      >
        <span className={formattedSavedDate ? "" : styles.placeholder}>
          {formattedSavedDate || resolvedPlaceholder}
        </span>
        <CalendarMonthIcon className={styles.inputIcon} fontSize="small" />
      </button>

      {isOpen &&
        createPortal(
          <article
            ref={popupRef}
            className={`${styles.calendarPopup} ${variantClassName}`}
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              width: `${popupPosition.width}px`,
            }}
          >
          <header className={styles.header}>
            <IconButton
              onClick={goToPreviousMonth}
              className={styles.navButton}
              disabled={!canGoToPreviousMonth}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <span className={styles.monthLabel}>
              {getMonthLabel(currentMonth)}
            </span>

            <IconButton
              onClick={goToNextMonth}
              className={styles.navButton}
              disabled={!canGoToNextMonth}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </header>

          <section className={styles.weekDays}>
            {WEEK_DAYS.map((day, index) => (
              <span key={day + index}>{day}</span>
            ))}
          </section>

          <section className={styles.dayGrid}>
            {monthDays.map(({ day, key }) => {
              if (!day) {
                return <span key={key} className={styles.emptyCell} />;
              }

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isDisabledDay(day)}
                  className={`${styles.dayButton} ${isSelectedDay(day) ? styles.selectedDay : ""} ${isDisabledDay(day) ? styles.disabledDay : ""}`}
                  onClick={() => {
                    if (isDisabledDay(day)) {
                      return;
                    }

                    setDraftDate(
                      normalizeDate(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth(),
                          day,
                        ),
                      ),
                    );
                  }}
                >
                  {day}
                </button>
              );
            })}
          </section>

          <footer className={styles.footer}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              className={styles.actionButton}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              className={styles.actionButton}
            >
              Guardar
            </Button>
          </footer>
          </article>,
          document.body,
        )}
    </section>
  );
};
