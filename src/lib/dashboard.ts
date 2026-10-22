import "server-only";
import { startOfDaysAgo } from "./dates";
import { prisma } from "./db";
import { ACTIVE_STAGES, WAITING_STAGES } from "./flow";
import { findAlerts, summarize } from "./metrics";

export const PERIODS = {
  hoje: { label: "Hoje", days: 0 },
  "7d": { label: "Últimos 7 dias", days: 6 },
  "30d": { label: "Últimos 30 dias", days: 29 },
} as const;

export type PeriodKey = keyof typeof PERIODS;

/** Aceita só períodos conhecidos; qualquer outra coisa na URL vira "hoje". */
export function parsePeriod(value: string | string[] | undefined): PeriodKey {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v in PERIODS ? (v as PeriodKey) : "hoje";
}

export async function loadDashboard(period: PeriodKey) {
  const since = startOfDaysAgo(PERIODS[period].days);

  const [tickets, waiting, inQueue] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        events: { select: { stage: true, createdAt: true } },
      },
    }),
    prisma.ticket.findMany({
      where: { stage: { in: WAITING_STAGES } },
      select: { code: true, type: true, stage: true, stageEnteredAt: true },
    }),
    prisma.ticket.count({ where: { stage: { in: ACTIVE_STAGES } } }),
  ]);

  return {
    summary: summarize(tickets),
    alerts: findAlerts(waiting),
    inQueue,
  };
}
