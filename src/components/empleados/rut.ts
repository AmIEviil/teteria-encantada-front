// Maximo 9 digitos de cuerpo + guion + digito verificador (0-9 o K): "202800074-2".
export const RUT_MAX_LENGTH = 11;
export const RUT_ERROR =
  "El RUT debe tener formato 202800074-2 (hasta 9 digitos y verificador 0-9 o K)";

const sanitizeRut = (value?: string | null): string =>
  (value ?? "").toUpperCase().replaceAll(/[^0-9K]/g, "");

export const formatRut = (value?: string | null): string => {
  const sanitized = sanitizeRut(value);

  if (sanitized.length <= 1) {
    return sanitized;
  }

  const verifier = sanitized.slice(-1);
  const body = sanitized.slice(0, -1).replaceAll("K", "").slice(0, 9);

  return body ? `${body}-${verifier}` : verifier;
};

export const isValidRut = (value: string): boolean => {
  const sanitized = sanitizeRut(value);
  const body = sanitized.slice(0, -1);

  return (
    body.length >= 1 &&
    body.length <= 9 &&
    /^\d+$/.test(body) &&
    /^[\dK]$/.test(sanitized.slice(-1))
  );
};
