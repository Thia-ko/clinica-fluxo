// Gera senhas FICTÍCIAS dos últimos 7 dias para o painel de gestão ter o que mostrar.
// Rode com: npm run seed:demo
// ATENÇÃO: apaga todas as senhas existentes antes de gerar (só para desenvolvimento).
import {
  PrismaClient,
  type FeedbackReason,
  type Stage,
  type TicketType,
} from "@prisma/client";
import { newFeedbackToken } from "../src/lib/feedbackToken";

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed de demonstração não pode rodar em produção.");
}

const prisma = new PrismaClient();

// Gerador pseudoaleatório com semente fixa: o resultado é sempre o mesmo.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

// Quantas senhas chegam em cada hora (picos às 8–10h e às 14h).
const ARRIVALS_PER_HOUR: Record<number, number> = {
  7: 4,
  8: 14,
  9: 18,
  10: 12,
  11: 8,
  12: 4,
  13: 7,
  14: 15,
  15: 10,
  16: 7,
  17: 4,
};

/** Minutos de espera/atendimento; `crowd` > 1 nos horários cheios. */
function durations(crowd: number) {
  return {
    waitReception: between(1, 6) * crowd,
    waitTriage: between(4, 14) * crowd,
    triage: between(4, 11),
    waitConsult: between(14, 34) * crowd * (rand() < 0.15 ? 1.8 : 1),
    consult: between(10, 28),
  };
}

const COMMENTS = {
  low: [
    "Esperei muito tempo para ser chamado.",
    "A demora para a consulta foi grande demais.",
    "Fiquei sem saber quanto tempo ainda faltava.",
  ],
  mid: [
    "Atendimento ok, mas poderia ser mais rápido.",
    "A espera foi razoável.",
  ],
  high: [
    "Fui bem atendido e rápido, obrigado!",
    "Equipe atenciosa.",
    "Tudo certo, sem demora.",
  ],
};

/** Avaliação fictícia: quem esperou muito dá nota menor e cita a demora. */
function makeFeedback(
  d: ReturnType<typeof durations>,
  doneAt: Date,
  now: Date,
) {
  const waitTotal = d.waitReception + d.waitTriage + d.waitConsult;
  const rating = Math.max(
    1,
    Math.min(5, Math.round(5 - waitTotal / 20 + between(-1, 1))),
  );

  const reasons: FeedbackReason[] = [];
  if (d.waitReception > 10) reasons.push("WAIT_RECEPTION");
  if (d.waitTriage > 15) reasons.push("WAIT_TRIAGE");
  if (d.waitConsult > 30) reasons.push("WAIT_CONSULT");
  if (rating <= 3 && rand() < 0.2) reasons.push("STAFF");
  if (rand() < 0.08) reasons.push("COMFORT");
  if (rand() < 0.06) reasons.push("SIGNAGE");
  const kept = rating >= 4 && rand() < 0.8 ? [] : reasons;

  const group = rating <= 2 ? "low" : rating === 3 ? "mid" : "high";
  const createdAt = new Date(
    Math.min(now.getTime(), doneAt.getTime() + between(2, 30) * 60_000),
  );
  return {
    rating,
    comment: rand() < 0.25 ? pick(COMMENTS[group]) : null,
    createdAt,
    reasons: { create: kept.map((reason) => ({ reason })) },
  };
}

async function main() {
  await prisma.ticket.deleteMany();

  const now = new Date();
  let created = 0;

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const counters = { NORMAL: 0, PRIORITY: 0 };

    for (const [hourStr, count] of Object.entries(ARRIVALS_PER_HOUR)) {
      const hour = Number(hourStr);
      const crowd = count >= 14 ? 1.6 : count >= 10 ? 1.25 : 1;

      for (let i = 0; i < count; i++) {
        const arrival = new Date(now);
        arrival.setDate(now.getDate() - daysAgo);
        arrival.setHours(
          hour,
          Math.floor(between(0, 59)),
          Math.floor(between(0, 59)),
          0,
        );
        if (arrival > now) continue; // não inventa senhas do futuro

        const type: TicketType = rand() < 0.2 ? "PRIORITY" : "NORMAL";
        counters[type] += 1;
        const code = `${type === "PRIORITY" ? "P" : "N"}${String(counters[type]).padStart(3, "0")}`;

        const d = durations(crowd);
        const steps: { stage: Stage; at: Date; room?: string }[] = [];
        let t = arrival.getTime();
        const push = (stage: Stage, room?: string) =>
          steps.push({ stage, at: new Date(t), room });
        const add = (minutes: number) => (t += minutes * 60_000);

        push("WAITING_RECEPTION");
        add(d.waitReception);
        push("WAITING_TRIAGE");
        add(d.waitTriage);
        push("IN_TRIAGE", pick(["Triagem 1", "Triagem 2"]));
        add(d.triage);
        push("WAITING_CONSULT");
        add(d.waitConsult);
        push(
          "IN_CONSULT",
          pick(["Consultório 1", "Consultório 2", "Consultório 3"]),
        );
        add(d.consult);
        push("DONE");

        // Só vale o que já aconteceu até agora; o resto fica "em andamento".
        const happened = steps.filter((s) => s.at <= now);
        const last = happened[happened.length - 1];
        const lastRoom = [...happened].reverse().find((s) => s.room)?.room;
        const feedback =
          last.stage === "DONE" && rand() < 0.55
            ? makeFeedback(d, last.at, now)
            : undefined;

        await prisma.ticket.create({
          data: {
            code,
            type,
            stage: last.stage,
            room: lastRoom ?? null,
            createdAt: arrival,
            stageEnteredAt: last.at,
            feedbackToken: newFeedbackToken(),
            ...(feedback ? { feedback: { create: feedback } } : {}),
            events: {
              create: happened.map((s) => ({
                stage: s.stage,
                room: s.room ?? null,
                createdAt: s.at,
              })),
            },
          },
        });
        created++;
      }
    }
  }

  console.log(`✔ ${created} senhas fictícias criadas (últimos 7 dias).`);
}

main().finally(() => prisma.$disconnect());
