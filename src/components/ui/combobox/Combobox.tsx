import { Combobox } from "@headlessui/react";
import { useTranslation } from "react-i18next";

interface ComboBoxOption {
  label: string;
  value: string;
}

interface Props {
  value: string;
  options: ComboBoxOption[];
  onChange: (value: string | null) => void;
  displayedValue?: string;
  title?: string;
  required?: boolean;
  labelPlaceholder?: string;
}

export default function CustomCombobox({
  value,
  options,
  onChange,
  displayedValue,
  title,
  required,
  labelPlaceholder,
}: Readonly<Props>) {
  const { t } = useTranslation();

  const filteredOptions =
    value === ""
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(value.toLowerCase()),
        );

  const displayValue =
    displayedValue || options.find((opt) => opt.value === value)?.label || "";

  return (
    <Combobox value={value} onChange={onChange}>
      <div className="relative">
        {title && (
          <label className="input-title" htmlFor={`input-field-${title}`}>
            {title} {required && <span className="required">*</span>}
          </label>
        )}
        <Combobox.Input
          className="border border-gray-300 p-2 rounded-sm! w-full"
          placeholder={labelPlaceholder ?? "Seleccione o escriba algo..."}
          onChange={(e) => onChange(e.target.value)}
          displayValue={() => displayValue}
        />

        <Combobox.Options className="absolute bg-white border border-gray-200 rounded-sm! w-full mt-1 max-h-48 overflow-auto shadow-sm z-10 custom-scrollbar">
          {filteredOptions.length === 0 && (
            <div className="p-2 text-gray-500 text-sm">
              {t("No se encontraron resultados para: {{searchTerm}}", { searchTerm: value })}
            </div>
          )}

          {filteredOptions.map((opt) => (
            <Combobox.Option
              key={opt.value}
              value={opt.value}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              {opt.label}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}
