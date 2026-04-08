import React, { useRef } from "react";
import { Button as RBButton } from "react-bootstrap";
import styles from "./button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive"
  | "tool"
  | "tool-no-stroke";

export type IconPosition = "left" | "right" | "only";
export type ButtonSize = "sm" | "md" | "lg";

type Props = {
  label?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  type?: "button" | "submit" | "reset";
  outline?: boolean;
  form?: string;
  formNoValidate?: boolean;
  className?: string;
  labelClassName?: string;
  testId?: string;
  requireLongPress?: boolean;
  longPressDuration?: number; // default 3000ms
  title?: string;
};

const Button = ({
  label,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
  iconPosition = "left",
  type = "button",
  outline = false,
  form,
  formNoValidate = false,
  className = "",
  labelClassName = "",
  testId,
  requireLongPress = false,
  longPressDuration = 3000,
  title,
}: Props) => {
  const bootstrapVariant = outline ? `outline-${variant}` : variant;
  const sizeProp = size === "md" ? undefined : size;
  const customClass = styles[`btn-${variant}`] || "";

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = () => {
    if (!requireLongPress) return;
    timerRef.current = setTimeout(() => {
      onClick?.();
    }, longPressDuration);
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (requireLongPress) {
      // ⚡️ Evita que el click normal dispare onClick
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  return (
    <RBButton
      form={form}
      formNoValidate={formNoValidate}
      data-testid={testId}
      type={type}
      variant={bootstrapVariant}
      size={sizeProp}
      disabled={disabled}
      className={`d-flex align-items-center ${
        label ? "gap-2" : ""
      } ${customClass} ${className}`}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      title={title}
    >
      {icon && iconPosition === "left" && <span>{icon}</span>}
      {iconPosition !== "only" && (
        <span className={`${labelClassName}`}>{label}</span>
      )}
      {icon && iconPosition === "right" && <span>{icon}</span>}
      {icon && iconPosition === "only" && !label && <span>{icon}</span>}
    </RBButton>
  );
};

export default Button;
