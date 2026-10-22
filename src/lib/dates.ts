/** Meia-noite de hoje, no horário do servidor. */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Meia-noite de `days` dias atrás (daysAgo(0) = hoje). */
export function startOfDaysAgo(days: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}
