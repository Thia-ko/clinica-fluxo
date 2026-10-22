"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseFeedbackInput } from "@/lib/feedback";

export type FeedbackState = { error?: string; done?: boolean };

/** Pública (o paciente não tem login): quem manda é o link secreto da senha. */
export async function submitFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const token = String(formData.get("token") ?? "");
  const parsed = parseFeedbackInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const ticket = token
    ? await prisma.ticket.findUnique({
        where: { feedbackToken: token },
        select: { id: true, stage: true },
      })
    : null;
  if (!ticket) return { error: "Link de avaliação inválido." };
  if (ticket.stage !== "DONE") {
    return { error: "A avaliação abre depois que o atendimento termina." };
  }

  const { rating, reasons, comment } = parsed.value;
  try {
    await prisma.feedback.create({
      data: {
        ticketId: ticket.id,
        rating,
        comment,
        reasons: { create: reasons.map((reason) => ({ reason })) },
      },
    });
  } catch (error) {
    // Já respondida (ticketId é único): agradecemos sem gravar de novo.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { done: true };
    }
    throw error;
  }

  return { done: true };
}
