import React, { useRef, useState } from "react";
import { useUploadImageMutation } from "../../../core/api/images.hooks";
import type { UploadedImage } from "../../../core/api/images.service";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

interface ImageUploadFieldProps {
  value: UploadedImage | null;
  onChange: (value: UploadedImage | null) => void;
  label?: string;
  disabled?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label = "Imagen",
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadImageMutation();

  const handleSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }

    setError(null);
    try {
      const uploaded = await uploadMutation.mutateAsync(file);
      onChange(uploaded);
    } catch {
      setError("No se pudo subir la imagen. Intenta nuevamente.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>

      {value?.url ? (
        <img
          src={value.url}
          alt={label}
          style={{ maxHeight: 160, objectFit: "contain" }}
        />
      ) : (
        <span className="text-sm text-gray-500">Sin imagen</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        disabled={disabled || uploadMutation.isPending}
        hidden
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Subiendo..." : "Seleccionar imagen"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled || uploadMutation.isPending}
          >
            Quitar
          </button>
        )}
      </div>

      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
};

export default ImageUploadField;
