export const formatMoneyNumber = (value: number | undefined) => {
  if (!value) return "";
  return Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(value);
};

export const toUpperCaseFirstLetter = (text: string) => {
  if (!text) return "";
  const normalizedText = text.toLowerCase().replace(/_/g, " ");
  return normalizedText.charAt(0).toUpperCase() + normalizedText.slice(1);
};

export const toPascalCaseMonth = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const formatName = (name: string) => {
  if (!name) return "";
  name = name.replace(/ /g, "_");
  return name;
};

export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseLocalDateString = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export const sanitizeInteger = (value: number, min = 1) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.round(value));
};

export const getAbbreviation = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("");
};
