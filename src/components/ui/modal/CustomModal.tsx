import { Modal } from "react-bootstrap";
import style from "./CustomModal.module.css";
import Button from "../button/Button";
import { useEffect, useRef, useState } from "react";
import CheckIcon from "../Icons/CheckIcon";
import SaveIcon from "@mui/icons-material/Save";

interface CustomModalProps {
  open: boolean;
  title?: string;
  content?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const CustomModal = ({
  open,
  content,
  title,
  cancelLabel,
  confirmLabel,
  onClose,
  onConfirm,
}: CustomModalProps) => {
  const [success, setSuccess] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleAcceptButton = async () => {
    if (onConfirm) {
      onConfirm();
    }
    setSuccess(true);
    timer.current = setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    setSuccess(false);
    onClose();
  };

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const renderFooterDialog = () => {
    return (
      <Modal.Footer className={style.dialogActions}>
        <button className={style.cancelButton} onClick={handleClose}>
          {cancelLabel || "Cancelar"}
        </button>
        <Button
          onClick={handleAcceptButton}
          label={confirmLabel || "Guardar"}
          disabled={success}
          icon={success ? <CheckIcon /> : <SaveIcon />}
        ></Button>
      </Modal.Footer>
    );
  };

  return (
    <Modal
      centered
      show={open}
      onHide={onClose}
      enforceFocus={false}
      className="casona-modal"
      dialogClassName={style.modalDialog}
    >
      <Modal.Header className={style.dialogTitle} closeButton>
        {title}
      </Modal.Header>
      {content && (
        <Modal.Body className={style.dialogBody}>
          <div className={style.formContainer}>{content}</div>
        </Modal.Body>
      )}
      {renderFooterDialog()}
    </Modal>
  );
};

export default CustomModal;
