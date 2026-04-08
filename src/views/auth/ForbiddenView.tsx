import { Link } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import "./AuthView.css";

export const ForbiddenView = () => {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sin permisos</h1>
        <p className="auth-subtitle">
          Tu perfil no tiene acceso a esta vista. Contacta al administrador si
          necesitas permisos adicionales.
        </p>

        <div className="auth-meta">
          <Link to={PAGE_ROUTES.Login} className="auth-link">
            Ir a iniciar sesión
          </Link>
          <Link to="/" className="auth-link">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
};
