import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../core/api/auth.service";
import { useBoundStore } from "../../store/BoundedStore";
import { PAGE_ROUTES } from "../../constant/routes";
import { roles } from "../../utils/role.utils";
import "./AuthView.css";

export const GoogleCallbackView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setToken = useBoundStore((state) => state.setToken);
  const setSession = useBoundStore((state) => state.setSession);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setToken(token);
    authService
      .profile()
      .then((user) => {
        setSession(token, user);
        const landing =
          user.role?.name === roles.CLIENT ? PAGE_ROUTES.PublicMisPuntos : "/";
        navigate(landing, { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [searchParams, setToken, setSession, navigate]);

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-subtitle">Conectando con Google…</p>
      </div>
    </section>
  );
};
