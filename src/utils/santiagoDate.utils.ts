import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const BUSINESS_TIMEZONE = "America/Santiago";

// El backend valida "hoy" y fechas futuras contra America/Santiago
// (ver back/src/common/date/santiago-date.ts). El navegador puede estar en
// otra zona horaria, así que toda comparación de "hoy" en el front debe
// anclarse también a Santiago para no ofrecer fechas que el backend rechace.
export const nowInSantiago = (): Dayjs => dayjs().tz(BUSINESS_TIMEZONE);

export const todayInSantiago = (): string =>
  nowInSantiago().format("YYYY-MM-DD");

export default dayjs;
