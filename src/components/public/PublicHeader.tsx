import { NavLink } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";

const getLinkClassName = ({ isActive }: { isActive: boolean }) => {
  return isActive
    ? "publicHeaderLink publicHeaderLink--active"
    : "publicHeaderLink";
};

export const PublicHeader = () => {
  return (
    <header className="publicHeader">
      <div>
        <p className="publicHeaderEyebrow">Teteria</p>
        <h1 className="publicHeaderTitle">Portal Publico</h1>
      </div>

      <nav className="publicHeaderNav" aria-label="Navegacion publica">
        <NavLink to={PAGE_ROUTES.PublicEvents} className={getLinkClassName}>
          Events
        </NavLink>
      </nav>
    </header>
  );
};
