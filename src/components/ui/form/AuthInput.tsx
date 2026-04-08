import { useId, useMemo, useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import "./AuthInput.css";

type AuthInputType = "text" | "email" | "password" | "tel";

interface AuthInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: AuthInputType;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
}

export const AuthInput = ({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  error,
  required = false,
  maxLength,
  minLength,
  autoComplete,
}: AuthInputProps) => {
  const inputId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = useMemo(() => {
    if (isPassword) {
      return showPassword ? "text" : "password";
    }

    return type;
  }, [isPassword, showPassword, type]);

  return (
    <label className="auth-input-field" htmlFor={inputId}>
      <span className="auth-input-label">{label}</span>
      <div className={`auth-input-shell ${error ? "has-error" : ""}`}>
        <input
          id={inputId}
          className="auth-input-control"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          type={inputType}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-input-password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
          </button>
        )}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="auth-input-error">
          {error}
        </span>
      ) : null}
    </label>
  );
};
