import { useState } from "react";
import { Link } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import { getApiErrorMessage } from "../../core/api/apiError";
import { authService } from "../../core/api/auth.service";
import { AuthInput } from "../../components/ui/form/AuthInput";
import { validateEmail } from "../../utils/validation.utils";
import "./AuthView.css";

export const ForgotPasswordView = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState("");

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setResetToken(null);

    const emailError = validateEmail(email);
    setFieldError(emailError);

    if (emailError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword({ email });
      setSuccessMessage(response.message);
      setResetToken(response.resetToken ?? null);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "No se pudo iniciar la recuperación de contraseña"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Te generaremos un token para restablecerla.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthInput
            label="Correo"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setFieldError("");
            }}
            onBlur={() => setFieldError(validateEmail(email))}
            type="email"
            required
            autoComplete="email"
            placeholder="usuario@casona.com"
            error={fieldError}
          />

          {errorMessage ? (
            <div className="auth-alert auth-alert-error">{errorMessage}</div>
          ) : null}

          {successMessage ? (
            <div className="auth-alert auth-alert-success">{successMessage}</div>
          ) : null}

          {resetToken ? (
            <div className="auth-alert auth-alert-success">
              <div className="auth-inline-token">Token: {resetToken}</div>
              <Link
                to={`${PAGE_ROUTES.ResetPassword}/${resetToken}`}
                className="auth-link"
              >
                Ir a restablecer contraseña
              </Link>
            </div>
          ) : null}

          <button className="auth-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Procesando..." : "Generar token"}
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
