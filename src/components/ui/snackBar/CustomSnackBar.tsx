import { useSnackBarModalStore } from "../../../store/snackBarStore";
import style from "./CustomSnackBar.module.css";

interface CustomSnackBarProps {
  onClick: () => void;
}

export const CustomSnackBar: React.FC<CustomSnackBarProps> = ({ onClick }) => {
  const { open, message } = useSnackBarModalStore();

  if (!open) return null;

  return (
    <div
      className={`${style.snackBarContainer} ${open ? style.show : style.hide}`}
      onClick={onClick}
    >
      <span>{message}</span>
    </div>
  );
};
