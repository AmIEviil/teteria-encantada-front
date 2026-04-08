import { useEffect, useRef, useState } from "react";
import style from "./CustomDropmenu.module.css";
import { useNavigate } from "react-router";

import { topbarOptions } from "../../../constant/routes";
import { toUpperCaseFirstLetter } from "../../../utils/formatText.utils";
import { BarsIcon } from "../icons/BarsIcon";
import HomeIcon from "@mui/icons-material/Home";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LogoutIcon from "../icons/LogoutIcon";
import MigrationsIcon from "../icons/MigrationsIcon";
import { useBoundStore } from "../../../store/BoundedStore";
import { StorageUtils } from "../../../utils/StorageUtils";

const CustomDropmenu = () => {
  const navigate = useNavigate();
  const userRole = useBoundStore((state) => state.userData?.role.name ?? null);
  const logOutUser = useBoundStore((state) => state.logOutUser);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const actualRoute = location.pathname.replace("/", "") || "Inicio";

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "home":
        return <HomeIcon />;
      // case "clients":
      //   return <PeopleOutlineIcon />;
      case "inventory":
        return <InventoryIcon />;
      case "sales":
        return <AssessmentIcon />;
      case "reservations":
        return <EventSeatIcon />;
      case "events":
        return <EventNoteIcon />;
      case "employees":
        return <PeopleOutlineIcon />;
      case "migration":
        return <MigrationsIcon />;
      case "logout":
        return <LogoutIcon />;
      default:
        return null;
    }
  };

  const handleLogout = () => {
    StorageUtils.clearAllStorage();
    logOutUser();
    navigate("/login");
  };

  const availableOptions = topbarOptions.filter((option) => {
    if (!option.canAccess || option.canAccess.length === 0) {
      return true;
    }

    if (!userRole) {
      return false;
    }

    return option.canAccess.includes(userRole);
  });

  return (
    <div className={style.dropmenuContainer}>
      <button
        type="button"
        className={`${style.dropmenuLabelNav}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {toUpperCaseFirstLetter(actualRoute)}
        <BarsIcon size={16} color="white" className="icon w-5!" />
      </button>
      <div
        ref={modalRef}
        style={{ display: isOpen ? "block" : "none" }}
        className={style.dropmenuOptionsContainer}
      >
        {availableOptions.map((option) => (
          <button
            type="button"
            key={option.name}
            className={style.optionLabelNav}
            onClick={() => {
              if (option.path === "/login") {
                handleLogout();
                setIsOpen(false);
                return;
              }
              navigate(option.path);
              setIsOpen(false);
            }}
          >
            {renderIcon(option.icon)}
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomDropmenu;
