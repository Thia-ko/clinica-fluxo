import { describe, expect, it } from "vitest";
import {
  findAlerts,
  stageDurations,
  summarize,
  totalDuration,
  type TimelineEvent,
} from "./metrics";

// Monta uma linha do tempo a partir de "minutos desde as 08:00".
function timeline(
  ...steps: [TimelineEvent["stage"], number][]
): TimelineEvent[] {
  const base = new Date(2026, 9, 21, 8, 0, 0).getTime();
  return steps.map(([stage, min]) => ({
    stage,
    createdAt: new Date(base + min * 60_000),
  }));
}

const FULL_DAY = timeline(
  ["WAITING_RECEPTION", 0],
  ["WAITING_TRIAGE", 5], // 5 min na recepção
  ["IN_TRIAGE", 25], // 20 min esperando triagem (limite 15)
  ["WAITING_CONSULT", 33], // 8 min de triagem
  ["IN_CONSULT", 53], // 20 min esperando consulta (limite 30)
  ["DONE", 70], // 17 min de consulta
);

describe("stageDurations", () => {
  it("mede o tempo em cada etapa já concluída", () => {
    const d = stageDurations(FULL_DAY);
    expect(d.WAITING_RECEPTION).toBe(5 * 60_000);
    expect(d.WAITING_TRIAGE).toBe(20 * 60_000);
    expect(d.IN_TRIAGE).toBe(8 * 60_000);
    expect(d.WAITING_CONSULT).toBe(20 * 60_000);
    expect(d.IN_CONSULT).toBe(17 * 60_000);
  });

  it("ignora a etapa em que a senha ainda está (sem saída)", () => {
    const d = stageDurations(
      timeline(["WAITING_RECEPTION", 0], ["WAITING_TRIAGE", 4]),
    );
    expect(d.WAITING_RECEPTION).toBe(4 * 60_000);
    expect(d.WAITING_TRIAGE).toBeUndefined();
  });

  it("não depende da ordem dos eventos", () => {
    const shuffled = [...FULL_DAY].reverse();
    expect(stageDurations(shuffled)).toEqual(stageDurations(FULL_DAY));
  });
});

describe("totalDuration", () => {
  it("vai da chegada até finalizar", () => {
    expect(totalDuration(FULL_DAY)).toBe(70 * 60_000);
  });

  it("é null enquanto o atendimento não terminou", () => {
    expect(
      totalDuration(timeline(["WAITING_RECEPTION", 0], ["WAITING_TRIAGE", 3])),
    ).toBeNull();
  });
});

describe("summarize", () => {
  const day = new Date(2026, 9, 21, 8, 0, 0);
  const tickets = [
    { createdAt: day, events: FULL_DAY },
    {
      createdAt: new Date(2026, 9, 21, 9, 30, 0),
      events: timeline(
        ["WAITING_RECEPTION", 90],
        ["WAITING_TRIAGE", 95], // 5 min
      ),
    },
  ];
  const s = summarize(tickets);

  it("conta emitidas e finalizadas", () => {
    expect(s.issued).toBe(2);
    expect(s.finished).toBe(1);
  });

  it("calcula média, máximo e % acima do limite por etapa", () => {
    const triage = s.stages.find((x) => x.stage === "WAITING_TRIAGE")!;
    expect(triage.count).toBe(1); // só a 1ª senha já saiu dessa etapa
    expect(triage.avgMin).toBe(20);
    expect(triage.limitMin).toBe(15);
    expect(triage.overLimitPct).toBe(100);

    const reception = s.stages.find((x) => x.stage === "WAITING_RECEPTION")!;
    expect(reception.count).toBe(2);
    expect(reception.avgMin).toBe(5);
    expect(reception.overLimitPct).toBe(0);
  });

  it("etapas sem limite não têm % acima do limite", () => {
    const consult = s.stages.find((x) => x.stage === "IN_CONSULT")!;
    expect(consult.limitMin).toBeUndefined();
    expect(consult.overLimitPct).toBeUndefined();
  });

  it("soma só as esperas para a espera média do paciente", () => {
    // 1ª senha: 5 + 20 + 20 = 45; 2ª senha: 5 → média 25
    expect(s.avgWaitMin).toBe(25);
    expect(s.avgTotalMin).toBe(70);
  });

  it("agrupa as senhas por hora de chegada", () => {
    expect(s.byHour[8]).toBe(1);
    expect(s.byHour[9]).toBe(1);
    expect(s.byHour[10]).toBe(0);
  });

  it("não quebra sem dados", () => {
    const empty = summarize([]);
    expect(empty.issued).toBe(0);
    expect(empty.avgWaitMin).toBeNull();
    expect(empty.stages).toEqual([]);
  });
});

describe("findAlerts", () => {
  const now = new Date(2026, 9, 21, 10, 0, 0);
  const ago = (min: number) => new Date(now.getTime() - min * 60_000);

  it("só alerta quem passou do limite da etapa, os piores primeiro", () => {
    const alerts = findAlerts(
      [
        {
          code: "N001",
          type: "NORMAL",
          stage: "WAITING_TRIAGE",
          stageEnteredAt: ago(16),
        }, // +1
        {
          code: "N002",
          type: "NORMAL",
          stage: "WAITING_TRIAGE",
          stageEnteredAt: ago(10),
        }, // ok
        {
          code: "P001",
          type: "PRIORITY",
          stage: "WAITING_CONSULT",
          stageEnteredAt: ago(50),
        }, // +20
      ],
      now,
    );
    expect(alerts.map((a) => a.code)).toEqual(["P001", "N001"]);
    expect(alerts[0].waitedMin).toBe(50);
    expect(alerts[0].limitMin).toBe(30);
  });

  it("ignora etapas sem limite", () => {
    const alerts = findAlerts(
      [
        {
          code: "N003",
          type: "NORMAL",
          stage: "IN_CONSULT",
          stageEnteredAt: ago(120),
        },
      ],
      now,
    );
    expect(alerts).toEqual([]);
  });
});
