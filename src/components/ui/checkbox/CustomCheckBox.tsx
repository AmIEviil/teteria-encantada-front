// CustomCheckbox.tsx
import React from "react";
import style from "./customCheckBox.module.css";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  className = "",
  onClick,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label className={style.container}>
      <input
        id="custom-checkbox"
        type="checkbox"
        className={`${className}`}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        onClick={onClick}
      />
      <span className={style.checkmark}></span>
    </label>
  );
};

export default CustomCheckbox;
