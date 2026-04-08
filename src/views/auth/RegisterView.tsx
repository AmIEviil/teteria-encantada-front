import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import { getApiErrorMessage } from "../../core/api/apiError";
import { authService } from "../../core/api/auth.service";
import type { AuthRole } from "../../core/api/types";
import { AuthInput } from "../../components/ui/form/AuthInput";
import { validateEmail, validatePassword } from "../../utils/validation.utils";
import { roles } from "../../utils/role.utils";
import { useBoundStore } from "../../store/BoundedStore";
import "./AuthView.css";

export const RegisterView = () => {
  const navigate = useNavigate();
  const setSession = useBoundStore((state) => state.setSession);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleName, setRoleName] = useState(roles.TEC);
  const [availableRoles, setAvailableRoles] = useState<AuthRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    firstName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadRoles = async () => {
      try {
        const rolesResponse = await authService.roles();

        if (isMounted) {
          setAvailableRoles(rolesResponse);
        }
      } catch {
        if (isMounted) {
          setAvailableRoles([
            { id: "fallback-super", name: roles.SUPER_ADMIN },
            { id: "fallback-admin", name: roles.ADMIN },
            { id: "fallback-tec", name: roles.TEC },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setErrorMessage("");

    const nextErrors = {
      username: username.trim().length < 3 ? "El usuario debe tener al menos 3 caracteres" : "",
      firstName: firstName.trim() ? "" : "El nombre es obligatorio",
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword:
        password === confirmPassword ? "" : "La confirmación de contraseña no coincide",
    };

    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.register({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        roleName,
      });

      setSession(response.accessToken, response.user);
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo registrar el usuario"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Crear usuario</h1>
        <p className="auth-subtitle">
          Registra un perfil nuevo y define su rol de acceso.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthInput
            label="Nombre de usuario"
            value={username}
            onChange={(value) => {
              setUsername(value);
              setFieldErrors((prev) => ({ ...prev, username: "" }));
            }}
            onBlur={() => {
              setFieldErrors((prev) => ({
                ...prev,
                username:
                  username.trim().length < 3
                    ? "El usuario debe tener al menos 3 caracteres"
                    : "",
              }));
            }}
            required
            maxLength={60}
            minLength={3}
            autoComplete="username"
            placeholder="usuario.casona"
            error={fieldErrors.username}
          />

          <div className="auth-grid">
            <AuthInput
              label="Nombre"
              value={firstName}
              onChange={(value) => {
                setFirstName(value);
                setFieldErrors((prev) => ({ ...prev, firstName: "" }));
              }}
              onBlur={() => {
                setFieldErrors((prev) => ({
                  ...prev,
                  firstName: firstName.trim() ? "" : "El nombre es obligatorio",
                }));
              }}
              required
              maxLength={80}
              placeholder="Nombre"
              error={fieldErrors.firstName}
            />

            <AuthInput
              label="Apellido"
              value={lastName}
              onChange={(value) => setLastName(value)}
              maxLength={80}
              placeholder="Apellido"
            />
          </div>

          <AuthInput
            label="Correo"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }}
            onBlur={() => {
              setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
            }}
            type="email"
            required
            autoComplete="email"
            placeholder="usuario@casona.com"
            error={fieldErrors.email}
          />

          <div className="auth-grid">
            <AuthInput
              label="Contraseña"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              onBlur={() => {
                setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }));
              }}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              error={fieldErrors.password}
            />

            <AuthInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              onBlur={() => {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword:
                    password === confirmPassword
                      ? ""
                      : "La confirmación de contraseña no coincide",
                }));
              }}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />
          </div>

          <label className="auth-label" htmlFor="roleName">
            <span>Rol / perfil</span>
            <select
              id="roleName"
              className="auth-select"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              disabled={isLoadingRoles}
            >
              {availableRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          {errorMessage ? (
            <div className="auth-alert auth-alert-error">{errorMessage}</div>
          ) : null}

          <button className="auth-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creando usuario..." : "Registrar"}
          </button>
        </form>

        <div className="auth-meta">
          <span>¿Ya tienes cuenta?</span>
          <Link to={PAGE_ROUTES.Login} className="auth-link">
            Inicia sesión
          </Link>
        </div>
      </div>
    </section>
  );
};
