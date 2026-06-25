import { NavLink, useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import { useBoundStore } from "../../store/BoundedStore";
import { StorageUtils } from "../../utils/StorageUtils";
import { roles } from "../../utils/role.utils";

const getLinkClassName = ({ isActive }: { isActive: boolean }) => {
  return isActive ? "publicHeaderLink publicHeaderLink--active" : "publicHeaderLink";
};

export const PublicHeader = () => {
  const navigate = useNavigate();
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);
  const role = useBoundStore((state) => state.userData?.role.name ?? null);
  const logOutUser = useBoundStore((state) => state.logOutUser);

  const isClient = isAuthenticated && role === roles.CLIENT;

  const handleLogout = () => {
    StorageUtils.clearAllStorage();
    logOutUser();
    navigate(PAGE_ROUTES.PublicLogin);
  };

  return (
    <header className="publicHeader">
      <div>
        <p className="publicHeaderEyebrow">Teteria</p>
        <h1 className="publicHeaderTitle">Portal Publico</h1>
      </div>

      <nav className="publicHeaderNav" aria-label="Navegacion publica">
        <NavLink to={PAGE_ROUTES.PublicReservas} className={getLinkClassName}>
          Reservas
        </NavLink>
        <NavLink to={PAGE_ROUTES.PublicCarta} className={getLinkClassName}>
          Carta
        </NavLink>
        {isClient ? (
          <>
            <NavLink to={PAGE_ROUTES.PublicMisPuntos} className={getLinkClassName}>
              Mis puntos
            </NavLink>
            <button
              type="button"
              className="publicHeaderLink"
              onClick={handleLogout}
            >
              Cerrar sesion
            </button>
          </>
        ) : null}
      </nav>
    </header>
  );
};
