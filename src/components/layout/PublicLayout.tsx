import "./MainLayout.css";
import { Outlet } from "react-router-dom";
import { TopBar } from "../topBar/TopBar";
import SnackBar from "../ui/snackBar/SnackBar";

export const PublicLayout = () => {
  return (
    <div className="mainLayoutContainer">
      <TopBar isAuthenticated={false} />
      <div className="main-content">
        <Outlet />
      </div>
      <SnackBar />
    </div>
  );
};
