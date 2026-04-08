import Modal from "react-bootstrap/Modal";
import Button from "../../button/Button";
import PDFViewer from "./pdfViewer";

interface ModalPdfViewerProps {
  visible: boolean;
  pdfData: {
    id?: number;
    title: string;
    url: string;
    revisado?: boolean;
  };
  onClose: () => void;
  onApprove?: () => void;
}

const ModalPdfViewer = ({
  visible,
  pdfData,
  onClose,
  onApprove,
}: ModalPdfViewerProps) => {
  const handleClose = () => {
    onClose();
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove();
    }
  };

  return (
    <Modal
      show={visible}
      onHide={handleClose}
      animation={false}
      className="casona-modal"
      dialogClassName="casona-modal-dialog"
      centered
      size="xl"
    >
      <Modal.Header closeButton>
        <b className="text-header-modal">{pdfData.title}</b>
      </Modal.Header>
      <Modal.Body className="p-0! h-[80vh]">
        <div>
          <PDFViewer file={pdfData.url || ""} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button label="Cancelar" variant="secondary" onClick={handleClose} />
        {onApprove && (
          <Button
            label={pdfData.revisado ? "Desaprobar" : "Aprobar"}
            variant="primary"
            onClick={handleApprove}
          />
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPdfViewer;
