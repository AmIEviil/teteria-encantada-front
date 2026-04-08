import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { DialogTitle } from "@mui/material";

interface PopUpProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText?: string;
  children: React.ReactNode;
}

const PopUp = ({
  open,
  onClose,
  onConfirm,
  title,
  confirmText,
  children,
}: PopUpProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={onConfirm}>{confirmText || "Confirmar"}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PopUp;
