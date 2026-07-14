export const HORA_STEP = 0.5;
export const MAX_HORAS = 24;

export const clampHoras = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const rounded = Math.round(value / HORA_STEP) * HORA_STEP;

  return Math.min(MAX_HORAS, Number(rounded.toFixed(1)));
};
