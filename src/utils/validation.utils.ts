export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string): string => {
  if (!value.trim()) {
    return "El correo es obligatorio";
  }

  if (!EMAIL_REGEX.test(value.trim())) {
    return "Ingresa un correo válido";
  }

  return "";
};

export const sanitizeRut = (value?: string | null): string => {
  return (value ?? "").toUpperCase().replaceAll(/[^0-9K]/g, "");
};

export const formatRut = (value?: string | null): string => {
  const sanitized = sanitizeRut(value);

  if (sanitized.length <= 1) {
    return sanitized;
  }

  const verifier = sanitized.slice(-1);
  let body = sanitized.slice(0, -1).replaceAll("K", "");

  if (!body) {
    return verifier;
  }

  body = body.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${body}-${verifier}`;
};

export const validateRut = (value: string): string => {
  const sanitized = sanitizeRut(value);

  if (sanitized.length < 2) {
    return "El RUT es obligatorio";
  }

  const verifier = sanitized.slice(-1);
  const body = sanitized.slice(0, -1);

  if (!/^\d+$/.test(body)) {
    return "El RUT solo puede contener números antes del dígito verificador";
  }

  if (!/^[\dK]$/.test(verifier)) {
    return "El dígito verificador solo puede ser número o K";
  }

  return "";
};

export const formatCellphone = (value?: string | null): string => {
  const digitsOnly = (value ?? "").replaceAll(/\D/g, "");
  let normalized = digitsOnly;

  if (normalized.startsWith("56")) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith("9")) {
    normalized = normalized.slice(1);
  }

  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  const subscriber = normalized.slice(0, 8);

  if (subscriber.length === 0) {
    return "+56 9";
  }

  if (subscriber.length <= 4) {
    return `+56 9 ${subscriber}`;
  }

  return `+56 9 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
};

export const validateCellphone = (value: string): string => {
  if (!/^\+56 9 \d{4} \d{4}$/.test(value.trim())) {
    return "El teléfono debe tener formato +56 9 XXXX XXXX";
  }

  return "";
};

export const validatePassword = (value: string): string => {
  if (!value) {
    return "La contraseña es obligatoria";
  }

  if (value.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    return "Debe incluir mayúscula, minúscula y número";
  }

  return "";
};
