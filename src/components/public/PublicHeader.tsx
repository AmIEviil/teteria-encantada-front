import { NavLink } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";

const getLinkClassName = ({ isActive }: { isActive: boolean }) => {
  return isActive ? "publicHeaderLink publicHeaderLink--active" : "publicHeaderLink";
};

export const PublicHeader = () => {
  return (
    <header className="publicHeader">
      <div>
        <p className="publicHeaderEyebrow">Teteria Encantada</p>
        <h1 className="publicHeaderTitle">Portal Publico</h1>
      </div>

      <nav className="publicHeaderNav" aria-label="Navegacion publica">
        <NavLink to={PAGE_ROUTES.PublicReservas} className={getLinkClassName}>
          Reservas
        </NavLink>
        <NavLink to={PAGE_ROUTES.PublicCarta} className={getLinkClassName}>
          Carta
        </NavLink>
      </nav>
    </header>
  );
};
