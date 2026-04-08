import "./MainLayout.css";
import { Outlet } from "react-router-dom";
import { TopBar } from "../topBar/TopBar";
import SnackBar from "../ui/snackBar/SnackBar";

export const BodyLayout = () => {
  return (
    <div className="mainLayoutContainer">
      <TopBar />
      <div className="main-content">
        <Outlet />
      </div>
      <SnackBar />
    </div>
  );
};
