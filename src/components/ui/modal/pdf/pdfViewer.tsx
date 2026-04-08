interface PDFViewerProps {
  file: string | File;
}

const PDFViewer = ({ file }: PDFViewerProps) => {
  if (!file) return null;

  return (
    <div className="pdf-container" style={{ height: "80vh" }}>
      <iframe
        title="Vista previa de PDF"
        src={typeof file === "string" ? file : URL.createObjectURL(file)}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        className="custom-scrollbar"
      >
        <p>
          Tu navegador no soporta iframes.{" "}
          <a href={typeof file === "string" ? file : URL.createObjectURL(file)}>
            Descargar PDF
          </a>
        </p>
      </iframe>
    </div>
  );
};

export default PDFViewer;
