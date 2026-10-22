import { describe, expect, it } from "vitest";
import { parseFeedbackInput } from "./feedback";
import { summarizeFeedback } from "./metrics";

function form(entries: [string, string][]) {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

describe("parseFeedbackInput", () => {
  it("aceita nota, motivos e comentário válidos", () => {
    const r = parseFeedbackInput(
      form([
        ["rating", "2"],
        ["reasons", "WAIT_TRIAGE"],
        ["reasons", "STAFF"],
        ["comment", "  Esperei muito  "],
      ]),
    );
    expect(r).toEqual({
      ok: true,
      value: {
        rating: 2,
        reasons: ["WAIT_TRIAGE", "STAFF"],
        comment: "Esperei muito",
      },
    });
  });

  it("comentário vazio vira null e motivo repetido é descartado", () => {
    const r = parseFeedbackInput(
      form([
        ["rating", "5"],
        ["reasons", "OTHER"],
        ["reasons", "OTHER"],
        ["comment", "   "],
      ]),
    );
    expect(r).toEqual({
      ok: true,
      value: { rating: 5, reasons: ["OTHER"], comment: null },
    });
  });

  it.each(["0", "6", "3.5", "abc", ""])("rejeita a nota %j", (rating) => {
    expect(parseFeedbackInput(form([["rating", rating]])).ok).toBe(false);
  });

  it("rejeita motivo que não existe", () => {
    const r = parseFeedbackInput(
      form([
        ["rating", "3"],
        ["reasons", "HACK"],
      ]),
    );
    expect(r.ok).toBe(false);
  });

  it("rejeita comentário acima de 500 caracteres", () => {
    const r = parseFeedbackInput(
      form([
        ["rating", "3"],
        ["comment", "x".repeat(501)],
      ]),
    );
    expect(r.ok).toBe(false);
  });
});

describe("summarizeFeedback", () => {
  const rows = [
    { rating: 5, reasons: [] },
    { rating: 4, reasons: ["STAFF" as const] },
    { rating: 2, reasons: ["WAIT_TRIAGE" as const, "WAIT_CONSULT" as const] },
    { rating: 1, reasons: ["WAIT_TRIAGE" as const] },
  ];
  const s = summarizeFeedback(rows, 10);

  it("calcula média, distribuição e taxa de resposta", () => {
    expect(s.count).toBe(4);
    expect(s.avg).toBe(3);
    expect(s.distribution).toEqual([1, 1, 0, 1, 1]);
    expect(s.responseRate).toBe(40);
  });

  it("ordena os motivos do mais citado para o menos", () => {
    expect(s.reasons[0]).toEqual({ reason: "WAIT_TRIAGE", count: 2 });
    expect(s.reasons).toHaveLength(3);
  });

  it("não quebra sem respostas nem atendimentos", () => {
    const empty = summarizeFeedback([], 0);
    expect(empty.avg).toBeNull();
    expect(empty.responseRate).toBeNull();
    expect(empty.reasons).toEqual([]);
  });
});
