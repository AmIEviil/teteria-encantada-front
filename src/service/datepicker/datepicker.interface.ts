export interface DatePickerFooterProps {
  onClear: () => void;
  onToday: () => void;
}

export interface CalendarProps {
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
