import { type ReactNode } from "react";
import "./InputText.css";
import EyeIcon from "../Icons/EyeIcon";

interface InputTextProps {
  title?: string;
  caption?: string;
  value?: string | number;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  require?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  icon?: ReactNode;
  customClass?: string;
  customClassTitle?: string;
  customClassContainer?: string;
}

const CustomInputText = ({
  title = "",
  value = "",
  disabled = false,
  type = "text",
  placeholder,
  require = false,
  maxLength,
  onChange = () => {},
  onBlur = () => {},
  icon,
  customClass = "",
  customClassTitle = "",
  customClassContainer = "",
}: InputTextProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.value);
    }
  };

  const isPasswordType = type === "password";

  const handleSeePassword = () => {
    const inputField = document.getElementById(
      `input-field-${title}`,
    ) as HTMLInputElement;
    if (isPasswordType && inputField.type === "password") {
      inputField.type = "text";
    } else {
      inputField.type = "password";
    }
  };

  const handleIconClick = () => {
    if (type === "password") {
      handleSeePassword();
    }
  };

  return (
    <div
      className={`input-text-container ${customClassContainer} ${
        disabled ? "disabled-container" : ""
      }`}
    >
      {title && (
        <div className={`title-container ${customClassTitle}`}>
          <label className="input-title" htmlFor={`input-field-${title}`}>
            {title} {require && <span className="required">*</span>}
          </label>
        </div>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={`input-field ${customClass} ${
            disabled ? "disabled" : ""
          } ${icon ? "with-icon" : "pl-2!"}`}
          type={type}
          id={`input-field-${title}`}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          onBlur={onBlur}
          maxLength={maxLength}
        />
        {isPasswordType && (
          <span className="input-icon-password" onClick={handleIconClick}>
            <EyeIcon size={16} color={disabled ? "#A0A0A0" : "#131313"} />
          </span>
        )}
      </div>
    </div>
  );
};

export default CustomInputText;
