import type { FeedbackReason } from "@prisma/client";

export const REASON_LABEL: Record<FeedbackReason, string> = {
  WAIT_RECEPTION: "Demora na recepção",
  WAIT_TRIAGE: "Demora na triagem",
  WAIT_CONSULT: "Demora para ser chamado à consulta",
  STAFF: "Atendimento da equipe",
  COMFORT: "Conforto e limpeza do ambiente",
  SIGNAGE: "Falta de informação ou sinalização",
  OTHER: "Outro motivo",
};

export const ALL_REASONS = Object.keys(REASON_LABEL) as FeedbackReason[];

export const RATING_LABEL: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

export const COMMENT_MAX = 500;

export type FeedbackInput = {
  rating: number;
  reasons: FeedbackReason[];
  comment: string | null;
};

type ParseResult =
  { ok: true; value: FeedbackInput } | { ok: false; error: string };

/** Valida o formulário no servidor: o navegador pode mandar qualquer coisa. */
export function parseFeedbackInput(formData: FormData): ParseResult {
  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Escolha uma nota de 1 a 5." };
  }

  const sent = formData.getAll("reasons").map(String);
  if (sent.some((r) => !ALL_REASONS.includes(r as FeedbackReason))) {
    return { ok: false, error: "Motivo inválido." };
  }
  const reasons = [...new Set(sent)] as FeedbackReason[];

  const comment = String(formData.get("comment") ?? "").trim();
  if (comment.length > COMMENT_MAX) {
    return {
      ok: false,
      error: `O comentário pode ter no máximo ${COMMENT_MAX} caracteres.`,
    };
  }

  return { ok: true, value: { rating, reasons, comment: comment || null } };
}
