import Modal from "react-bootstrap/Modal";
import Button from "../../button/Button";
import { useModalStore } from "../../../../store/ModalStore";

const ModalMediaVisualizer = () => {
  const visible = useModalStore((state) => state.isModalOpen);
  const dialogClassName = useModalStore((state) => state.dialogClassName);
  const bodyClassName = useModalStore((state) => state.bodyClassName);
  const headerData = useModalStore((state) => state.headerContent);
  const mediaData = useModalStore((state) => state.modalContent);
  const footerData = useModalStore((state) => state.footerContent);
  const onClose = useModalStore((state) => state.closeModal);
  const onAccept = useModalStore((state) => state.onAccept);

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      show={visible}
      onHide={handleClose}
      animation={false}
      className="casona-modal"
      dialogClassName={`casona-modal-dialog ${dialogClassName}`}
      centered
      size="xl"
    >
      <Modal.Header closeButton>{headerData}</Modal.Header>
      <Modal.Body className={`${bodyClassName}`}>{mediaData}</Modal.Body>
      <Modal.Footer>
        {footerData || (
          <>
            <Button
              label="Cancelar"
              variant="secondary"
              onClick={handleClose}
            />
            <Button
              label="Aceptar"
              variant="primary"
              onClick={onAccept || handleClose}
            />
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalMediaVisualizer;
