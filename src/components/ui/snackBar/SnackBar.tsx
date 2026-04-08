import { useEffect } from "react";
import "./SnackBar.style.css";
import InfoIcon from "../icons/InfoIcon";
import CircleCheckIcon from "../icons/CircleCheckIcon";
import WarningIcon from "../icons/WarningIcon";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import ErrorIconV2 from "../icons/ErrorIconV2";
import CloseIcon from "../icons/CloseIcon";

const SnackBar = () => {
  const setVisible = useSnackBarResponseStore(
    (state) => state.setSnackbarVisible
  );
  const showSnackBar = useSnackBarResponseStore(
    (state) => state.snackbarVisible
  );
  const message = useSnackBarResponseStore((state) => state.snackbarMessage);
  const type = useSnackBarResponseStore((state) => state.snackbarType);
  const duration = useSnackBarResponseStore((state) => state.snackbarDuration);

  useEffect(() => {
    if (!showSnackBar) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [showSnackBar, duration, setVisible]);

  const handleClose = () => {
    setVisible(false);
  };

  const handleClassName = () => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  if (!showSnackBar) return null;

  return (
    <div className={`snackbar-container show ${handleClassName()}`}>
      {type === "info" && <InfoIcon color="white" size={24} />}
      {type === "success" && <CircleCheckIcon color="white" size={24} />}
      {type === "warning" && <WarningIcon color="white" size={24} />}
      {type === "error" && <ErrorIconV2 color="white" size={24} />}
      <span className="mx-4">{message}</span>
      <button className="snackbar-close-button" onClick={handleClose}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default SnackBar;
