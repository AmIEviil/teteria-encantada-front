import { useRef } from "react";
import style from "../CustomModal.module.css";

interface MediaVisualizerProps {
  currentMedia: {
    _kind: string;
    url: string;
    name: string;
  };
  fullScreenImage?: boolean;
}

const MediaVisualizer: React.FC<MediaVisualizerProps> = ({
  currentMedia,
  fullScreenImage,
}) => {
  const mediaRef = useRef<HTMLImageElement>(null);

  if (currentMedia._kind === "img") {
    return (
      <img
        ref={mediaRef}
        src={currentMedia.url}
        alt={currentMedia.name}
        className={fullScreenImage ? style.imageFull : style.image}
        style={{ maxHeight: "80dvh", objectFit: "contain" }}
        loading="lazy"
        onError={(e) => {
          // Fallback por si falla la carga
          e.currentTarget.src = "ruta/a/imagen/por_defecto.png";
        }}
      />
    );
  }

  return (
    <iframe
      src={currentMedia.url}
      title={currentMedia.name}
      width="100%"
      height="100%"
      allow="autoplay; fullscreen"
      className="rounded-md border-none"
      style={{ minHeight: "50dvh" }}
    />
  );
};

export default MediaVisualizer;
