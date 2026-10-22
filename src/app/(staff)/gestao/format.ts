/** 7.4 → "7 min"; 65 → "1 h 05". Menos de 1 minuto vira "< 1 min". */
export function fmtMin(minutes: number) {
  if (minutes < 1) return "< 1 min";
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = String(total % 60).padStart(2, "0");
  return `${h} h ${m}`;
}
