import type { FeedbackReason, Stage, TicketType } from "@prisma/client";
import { hourInClinicTz } from "./dates";
import { MEASURED_STAGES, WAIT_LIMIT_MIN, WAITING_STAGES } from "./flow";

const MIN = 60_000;

export type TimelineEvent = { stage: Stage; createdAt: Date };
export type TicketTimeline = { createdAt: Date; events: TimelineEvent[] };

/**
 * Quanto tempo (em ms) a senha ficou em cada etapa que ela JÁ deixou.
 * Cada evento marca a entrada numa etapa; a saída é o evento seguinte.
 */
export function stageDurations(events: TimelineEvent[]) {
  const sorted = [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const result: Partial<Record<Stage, number>> = {};
  for (let i = 0; i < sorted.length - 1; i++) {
    const ms =
      sorted[i + 1].createdAt.getTime() - sorted[i].createdAt.getTime();
    result[sorted[i].stage] = (result[sorted[i].stage] ?? 0) + ms;
  }
  return result;
}

/** Da chegada até finalizar (ms), ou null se o atendimento ainda não terminou. */
export function totalDuration(events: TimelineEvent[]) {
  const sorted = [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const last = sorted.at(-1);
  if (!last || last.stage !== "DONE") return null;
  return last.createdAt.getTime() - sorted[0].createdAt.getTime();
}

export type StageStat = {
  stage: Stage;
  count: number;
  avgMin: number;
  maxMin: number;
  limitMin?: number;
  /** % dos atendimentos que passaram do limite (só para etapas com limite). */
  overLimitPct?: number;
};

export type Summary = {
  issued: number;
  finished: number;
  /** Senhas chamadas que não compareceram. */
  noShows: number;
  stages: StageStat[];
  /** Média da soma das esperas de cada paciente (o que ele sente). */
  avgWaitMin: number | null;
  /** Média do tempo total na clínica, só de quem já terminou. */
  avgTotalMin: number | null;
  /** Senhas emitidas por hora do dia (0–23). */
  byHour: number[];
};

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export function summarize(tickets: TicketTimeline[]): Summary {
  const perStage = new Map<Stage, number[]>();
  const waitTotals: number[] = [];
  const totals: number[] = [];
  const byHour = Array.from({ length: 24 }, () => 0);
  let noShows = 0;

  for (const t of tickets) {
    byHour[hourInClinicTz(t.createdAt)] += 1;
    if (t.events.some((e) => e.stage === "NO_SHOW")) noShows += 1;

    const durations = stageDurations(t.events);
    let waitSum = 0;
    let hasWait = false;
    for (const stage of MEASURED_STAGES) {
      const ms = durations[stage];
      if (ms === undefined) continue;
      perStage.set(stage, [...(perStage.get(stage) ?? []), ms / MIN]);
      if (WAITING_STAGES.includes(stage)) {
        waitSum += ms / MIN;
        hasWait = true;
      }
    }
    if (hasWait) waitTotals.push(waitSum);

    const total = totalDuration(t.events);
    if (total !== null) totals.push(total / MIN);
  }

  const stages: StageStat[] = MEASURED_STAGES.flatMap((stage) => {
    const values = perStage.get(stage);
    if (!values?.length) return [];
    const limitMin = WAIT_LIMIT_MIN[stage];
    return [
      {
        stage,
        count: values.length,
        avgMin: mean(values)!,
        maxMin: Math.max(...values),
        limitMin,
        overLimitPct:
          limitMin === undefined
            ? undefined
            : (values.filter((v) => v > limitMin).length / values.length) * 100,
      },
    ];
  });

  return {
    issued: tickets.length,
    finished: totals.length,
    noShows,
    stages,
    avgWaitMin: mean(waitTotals),
    avgTotalMin: mean(totals),
    byHour,
  };
}

export type WaitingTicket = {
  code: string;
  type: TicketType;
  stage: Stage;
  stageEnteredAt: Date;
};

export type Alert = WaitingTicket & { waitedMin: number; limitMin: number };

/** Senhas paradas numa etapa de espera há mais tempo que o limite, as piores primeiro. */
export function findAlerts(
  waiting: WaitingTicket[],
  now = new Date(),
): Alert[] {
  return waiting
    .flatMap((t) => {
      const limitMin = WAIT_LIMIT_MIN[t.stage];
      if (limitMin === undefined) return [];
      const waitedMin = (now.getTime() - t.stageEnteredAt.getTime()) / MIN;
      return waitedMin > limitMin ? [{ ...t, waitedMin, limitMin }] : [];
    })
    .sort((a, b) => b.waitedMin - b.limitMin - (a.waitedMin - a.limitMin));
}

export type FeedbackRow = { rating: number; reasons: FeedbackReason[] };

export type FeedbackSummary = {
  count: number;
  /** Nota média de 1 a 5. */
  avg: number | null;
  /** Quantas respostas de cada nota; índice 0 = nota 1. */
  distribution: number[];
  /** Motivos mais citados primeiro. */
  reasons: { reason: FeedbackReason; count: number }[];
  /** % dos atendimentos finalizados que responderam. */
  responseRate: number | null;
};

export function summarizeFeedback(
  rows: FeedbackRow[],
  finished: number,
): FeedbackSummary {
  const distribution = [0, 0, 0, 0, 0];
  const reasonCount = new Map<FeedbackReason, number>();

  for (const row of rows) {
    distribution[row.rating - 1] += 1;
    for (const reason of new Set(row.reasons)) {
      reasonCount.set(reason, (reasonCount.get(reason) ?? 0) + 1);
    }
  }

  return {
    count: rows.length,
    avg: mean(rows.map((r) => r.rating)),
    distribution,
    reasons: [...reasonCount]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    responseRate:
      finished > 0 ? Math.min(100, (rows.length / finished) * 100) : null,
  };
}
