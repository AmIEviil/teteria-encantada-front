import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import style from "./MultipleSelect.module.css";
import "./Dropdown.css";
import CaretIcon from "../Icons/CaretIcon";
import ArrowIcon from "../Icons/ArrowIcon";
import CheckIcon from "../Icons/CheckIcon";

export interface DropdownOptions {
  value: string | number;
  label: string;
}

interface MultiSelectDropdownProps {
  options: DropdownOptions[];
  value: string; // string con valores separados por coma ("1,2,3")
  onSelect: (value: string) => void;
  placeholder?: string;
  buttonClassName?: string;
  buttonContent?: React.ReactNode;
  arrowType?: "caret" | "arrow";
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  value,
  onSelect,
  placeholder = "Seleccionar...",
  buttonClassName = "",
  buttonContent,
  arrowType = "caret",
}) => {
  const [show, setShow] = useState(false);
  const selectedValues = value ? value.split(",") : [];
  const toggleOption = (label: string) => {
    let updated: string[];

    if (selectedValues.includes(label)) {
      updated = selectedValues.filter((l) => l !== label);
    } else {
      updated = [...selectedValues, label];
    }

    onSelect(updated.join(","));
  };

  const displayLabel =
    selectedValues.length > 0
      ? options
          .filter((opt) => selectedValues.includes(opt.label.toString()))
          .map((opt) => opt.label)
          .join(", ")
      : placeholder;

  return (
    <Dropdown
      show={show}
      onToggle={(isOpen) => setShow(isOpen)}
      autoClose="outside"
    >
      <Dropdown.Toggle
        as="button"
        className={`${buttonClassName} ${style.customDropdownToggle}`}
        onClick={(e) => {
          e.preventDefault();
          setShow(!show);
        }}
      >
        <span>{buttonContent ?? displayLabel}</span>
        {arrowType === "caret" ? (
          <CaretIcon
            size={16}
            direction={show ? "up" : "down"}
            className="ml-2"
          />
        ) : (
          <ArrowIcon
            size={16}
            direction={show ? "up" : "down"}
            className="ml-2"
          />
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className={`${style.customMenuDropdown} custom-scrollbar`}
        align="start"
      >
        {options.map((option) => (
          <Dropdown.Item
            key={option.value}
            onClick={(e) => {
              e.preventDefault();
              toggleOption(option.label.toString()); // importante: usar label
            }}
            active={selectedValues.includes(option.label.toString())}
          >
            <span className="flex items-center justify-between w-full">
              {option.label}
              {selectedValues.includes(option.label.toString()) && (
                <CheckIcon size={16} color="#006CD9" />
              )}
            </span>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default MultiSelectDropdown;
