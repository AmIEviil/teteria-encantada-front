import type { ReactNode } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "../../button/Button";
import { useModalStore } from "../../../../store/modalStore";

const MEDIA_VISUALIZER_MODAL_KEY = "media-visualizer-modal";

interface MediaVisualizerPayload {
  dialogClassName?: string;
  bodyClassName?: string;
  headerContent?: ReactNode;
  modalContent?: ReactNode;
  footerContent?: ReactNode;
  onAccept?: () => void;
}

const ModalMediaVisualizer = () => {
  const openModals = useModalStore((state) => state.openModals);
  const modalPayloads = useModalStore((state) => state.modalPayloads);
  const closeModal = useModalStore((state) => state.closeModal);

  const visible = Boolean(openModals[MEDIA_VISUALIZER_MODAL_KEY]);
  const payload =
    (modalPayloads[MEDIA_VISUALIZER_MODAL_KEY] as MediaVisualizerPayload) ??
    undefined;

  const dialogClassName = payload?.dialogClassName;
  const bodyClassName = payload?.bodyClassName;
  const headerData = payload?.headerContent;
  const mediaData = payload?.modalContent;
  const footerData = payload?.footerContent;
  const onAccept = payload?.onAccept;

  const handleClose = () => {
    closeModal(MEDIA_VISUALIZER_MODAL_KEY);
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
