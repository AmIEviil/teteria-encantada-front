import { GoogleLoginButton } from "../../components/ui/auth/GoogleLoginButton";
import "./AuthView.css";

export const PublicLoginView = () => {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Bienvenido a D'Encanto</h1>
        <p className="auth-subtitle">
          Ingresa con tu cuenta de Google para reservar, ver la carta y juntar
          tus puntos.
        </p>

        <GoogleLoginButton label="Ingresar con Google" />
      </div>
    </section>
  );
};
