import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import { getApiErrorMessage } from "../../core/api/apiError";
import { authService } from "../../core/api/auth.service";
import { AuthInput } from "../../components/ui/form/AuthInput";
import { validatePassword } from "../../utils/validation.utils";
import "./AuthView.css";

export const ResetPasswordView = () => {
  const { token } = useParams<{ token?: string }>();
  const initialToken = useMemo(() => token ?? "", [token]);

  const [tokenValue, setTokenValue] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    token: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const nextErrors = {
      token: tokenValue.trim() ? "" : "El token es obligatorio",
      newPassword: validatePassword(newPassword),
      confirmPassword:
        newPassword === confirmPassword ? "" : "La confirmación de contraseña no coincide",
    };

    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword({
        token: tokenValue,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage(response.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "No se pudo restablecer la contraseña"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Restablecer contraseña</h1>
        <p className="auth-subtitle">
          Ingresa el token de recuperación y tu nueva contraseña.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthInput
            label="Token"
            value={tokenValue}
            onChange={(value) => {
              setTokenValue(value);
              setFieldErrors((prev) => ({ ...prev, token: "" }));
            }}
            onBlur={() => {
              setFieldErrors((prev) => ({
                ...prev,
                token: tokenValue.trim() ? "" : "El token es obligatorio",
              }));
            }}
            placeholder="Token de recuperación"
            error={fieldErrors.token}
          />

          <AuthInput
            label="Nueva contraseña"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
            }}
            onBlur={() => {
              setFieldErrors((prev) => ({
                ...prev,
                newPassword: validatePassword(newPassword),
              }));
            }}
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            error={fieldErrors.newPassword}
          />

          <AuthInput
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            onBlur={() => {
              setFieldErrors((prev) => ({
                ...prev,
                  confirmPassword:
                    newPassword === confirmPassword
                      ? ""
                      : "La confirmación de contraseña no coincide",
              }));
            }}
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
          />

          {errorMessage ? (
            <div className="auth-alert auth-alert-error">{errorMessage}</div>
          ) : null}

          {successMessage ? (
            <div className="auth-alert auth-alert-success">{successMessage}</div>
          ) : null}

          <button className="auth-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>

        <div className="auth-meta">
          <Link to={PAGE_ROUTES.Login} className="auth-link">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  );
};
