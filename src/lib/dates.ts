/**
 * Datas no fuso da clínica.
 *
 * O servidor na nuvem roda em UTC; sem isto, "hoje" começaria às 21h de
 * Brasília e o gráfico de horários ficaria deslocado em 3 horas.
 */
export const CLINIC_TZ = "America/Sao_Paulo";

/** Ano, mês, dia, hora... de um instante, como o relógio do fuso o mostra. */
function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Quanto o relógio do fuso está à frente (ou atrás) do UTC naquele instante, em ms. */
function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Meia-noite (no fuso da clínica) do dia em que `date` cai. */
export function startOfDay(date: Date = new Date(), timeZone = CLINIC_TZ) {
  const p = zonedParts(date, timeZone);
  const utcMidnight = Date.UTC(p.year, p.month - 1, p.day);
  // Duas passadas: a segunda corrige o deslocamento caso ele mude no dia (horário de verão).
  const first = utcMidnight - offsetMs(new Date(utcMidnight), timeZone);
  return new Date(utcMidnight - offsetMs(new Date(first), timeZone));
}

/** Meia-noite de hoje, no fuso da clínica. */
export function startOfToday(now: Date = new Date()) {
  return startOfDay(now);
}

/** Meia-noite de `days` dias atrás (startOfDaysAgo(0) = hoje). */
export function startOfDaysAgo(days: number, now: Date = new Date()) {
  const noonToday = new Date(startOfDay(now).getTime() + 12 * 3_600_000);
  return startOfDay(new Date(noonToday.getTime() - days * 86_400_000));
}

/** Hora do dia (0–23) de um instante, no fuso da clínica. */
export function hourInClinicTz(date: Date) {
  return zonedParts(date, CLINIC_TZ).hour;
}
