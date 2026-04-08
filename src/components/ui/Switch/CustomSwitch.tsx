import style from "./CustomSwitch.module.css";

interface CustomSwitchProps {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  customClass?: string;
  disabled?: boolean;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  title,
  checked,
  onChange,
  required,
  customClass,
  disabled,
}) => {
  const options = [
    { label: "Sí", value: true },
    { label: "No", value: false },
  ];

  return (
    <div className={`${style.customSwitchContainer} ${customClass}`}>
      <span className="input-title">
        {title}
        {required && <span className="required">*</span>}
      </span>
      <div className={`${style.switchContainerShort}`}>
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.value)}
            className={`${style.btnSwitchShort} ${
              checked === option.value ? style.active : ""
            }`}
            disabled={disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
