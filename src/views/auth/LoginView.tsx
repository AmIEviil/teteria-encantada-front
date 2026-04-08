import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import { getApiErrorMessage } from "../../core/api/apiError";
import { authService } from "../../core/api/auth.service";
import { useBoundStore } from "../../store/BoundedStore";
import { AuthInput } from "../../components/ui/form/AuthInput";
import "./AuthView.css";

interface LoginRedirectState {
  from?: {
    pathname?: string;
  };
}

export const LoginView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);
  const setSession = useBoundStore((state) => state.setSession);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });

  const targetPath = useMemo(() => {
    const state = location.state as LoginRedirectState | null;
    return state?.from?.pathname ?? "/";
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, navigate, targetPath]);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setErrorMessage("");

    const nextErrors = {
      username: username.trim().length < 3 ? "El usuario debe tener al menos 3 caracteres" : "",
      password: password.length < 8 ? "La contraseña debe tener al menos 8 caracteres" : "",
    };

    setFieldErrors(nextErrors);

    if (nextErrors.username || nextErrors.password) {
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await authService.login({
        username,
        password,
      });

      setSession(response.accessToken, response.user);
      navigate(targetPath, { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo iniciar sesión"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Acceso a Casona Encantada</h1>
        <p className="auth-subtitle">
          Inicia sesión con tu perfil para entrar al panel.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthInput
            label="Nombre de usuario"
            value={username}
            onChange={(value) => {
              setUsername(value);
              setFieldErrors((prev) => ({ ...prev, username: "" }));
            }}
            type="text"
            required
            maxLength={60}
            minLength={3}
            autoComplete="username"
            placeholder="usuario.casona"
            error={fieldErrors.username}
            onBlur={() => {
              if (username.trim().length < 3) {
                setFieldErrors((prev) => ({
                  ...prev,
                  username: "El usuario debe tener al menos 3 caracteres",
                }));
              }
            }}
          />

          <AuthInput
            label="Contraseña"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="••••••••"
            error={fieldErrors.password}
            onBlur={() => {
              if (password.length < 8) {
                setFieldErrors((prev) => ({
                  ...prev,
                  password: "La contraseña debe tener al menos 8 caracteres",
                }));
              }
            }}
          />

          {errorMessage ? (
            <div className="auth-alert auth-alert-error">{errorMessage}</div>
          ) : null}

          <button className="auth-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="auth-meta">
          <Link to={PAGE_ROUTES.ForgotPassword} className="auth-link">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link to={PAGE_ROUTES.Register} className="auth-link">
            Crear usuario
          </Link>
        </div>
      </div>
    </section>
  );
};
