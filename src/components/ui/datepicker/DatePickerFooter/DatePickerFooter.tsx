import { useTranslation } from "react-i18next";
import type { DatePickerFooterProps } from "../../../../service/datepicker/datepicker.interface";

export const DatePickerFooter = ({ onClear, onToday }: DatePickerFooterProps) => {
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
