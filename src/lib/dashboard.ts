import "server-only";
import { startOfDaysAgo } from "./dates";
import { prisma } from "./db";
import { ACTIVE_STAGES, WAITING_STAGES } from "./flow";
import { findAlerts, summarize, summarizeFeedback } from "./metrics";

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

  const [tickets, waiting, inQueue, feedbackRows] = await Promise.all([
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
    prisma.feedback.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        reasons: { select: { reason: true } },
      },
    }),
  ]);

  const summary = summarize(tickets);
  const rows = feedbackRows.map((f) => ({
    rating: f.rating,
    reasons: f.reasons.map((r) => r.reason),
  }));

  return {
    summary,
    alerts: findAlerts(waiting),
    inQueue,
    feedback: summarizeFeedback(rows, summary.finished),
    // Comentários são texto livre do paciente: só exibimos, nunca interpretamos.
    comments: feedbackRows
      .filter((f) => f.comment)
      .slice(0, 8)
      .map((f) => ({
        rating: f.rating,
        comment: f.comment as string,
        at: f.createdAt,
        reasons: f.reasons.map((r) => r.reason),
      })),
  };
}
