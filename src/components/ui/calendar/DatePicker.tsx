// DatePicker.tsx
import { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import LabelField from "../labelField/LabelField";

interface DatePickersProps {
  label?: string;
  required?: boolean;
  value?: Dayjs;
  onChange: (value: Date) => void;
}

export default function DatePickers({
  value,
  onChange,
  label,
  required,
}: DatePickersProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <LabelField label={label} required={required} />}
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <MobileDatePicker
          value={value}
          onChange={(val) => {
            if (val?.isValid()) {
              onChange(val.toDate());
            }
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              InputProps: {
                sx: {
                  borderRadius: "24px",
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
}
