"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { startOfToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { newFeedbackToken } from "@/lib/feedbackToken";
import { CALLED_STAGES, TRANSITIONS, canAdvance } from "@/lib/flow";
import type { Stage, TicketType } from "@prisma/client";

/** Totem: gera a próxima senha do dia (N001, N002... / P001, P002...). */
export async function createTicket(type: TicketType) {
  const prefix = type === "PRIORITY" ? "P" : "N";

  const { ticket, ahead } = await prisma.$transaction(async (tx) => {
    const countToday = await tx.ticket.count({
      where: { type, createdAt: { gte: startOfToday() } },
    });
    const code = `${prefix}${String(countToday + 1).padStart(3, "0")}`;

    const ticket = await tx.ticket.create({
      data: {
        code,
        type,
        feedbackToken: newFeedbackToken(),
        events: { create: { stage: "WAITING_RECEPTION" } },
      },
    });

    // Quem será chamado antes: prioritária só espera outras prioritárias que
    // chegaram antes; normal espera todo mundo que chegou antes dela.
    const ahead = await tx.ticket.count({
      where: {
        stage: "WAITING_RECEPTION",
        id: { lt: ticket.id },
        ...(type === "PRIORITY" ? { type: "PRIORITY" } : {}),
      },
    });

    return { ticket, ahead };
  });

  revalidatePath("/fila");
  return {
    code: ticket.code,
    type: ticket.type,
    ahead,
    issuedAt: ticket.createdAt.toISOString(),
    feedbackToken: ticket.feedbackToken,
  };
}

/**
 * Carrega a senha e confere se o cargo de quem clicou pode agir na etapa dela.
 * Esconder o botão na tela não basta: toda ação confere login e cargo sozinha.
 */
async function loadForAction(formData: FormData) {
  const user = await requireUser();

  const id = Number(formData.get("id"));
  const ticket = Number.isInteger(id)
    ? await prisma.ticket.findUnique({ where: { id } })
    : null;
  if (!ticket) return null;

  const transition = TRANSITIONS[ticket.stage as Stage];
  if (!transition || !canAdvance(user.role, transition)) {
    redirect("/acesso-negado");
  }
  return { ticket, transition };
}

/** Fila: avança uma senha para a próxima etapa do fluxo. */
export async function advanceTicket(formData: FormData) {
  const loaded = await loadForAction(formData);
  if (!loaded) return;
  const { ticket, transition } = loaded;
  const room = (formData.get("room") as string | null) || null;

  // Só aceita salas que existem para aquela etapa (nunca confie no formulário).
  const finalRoom =
    transition.rooms && room && transition.rooms.includes(room)
      ? room
      : (transition.rooms?.[0] ?? null);

  // Só avança se a senha ainda está na etapa que a pessoa viu na tela
  // (evita duas pessoas avançarem a mesma senha ao mesmo tempo).
  const moved = await prisma.ticket.updateMany({
    where: { id: ticket.id, stage: ticket.stage },
    data: {
      stage: transition.next,
      room: finalRoom ?? ticket.room,
      stageEnteredAt: new Date(),
    },
  });
  if (moved.count === 1) {
    await prisma.ticketEvent.create({
      data: { ticketId: ticket.id, stage: transition.next, room: finalRoom },
    });
  }

  revalidatePath("/fila");
}

const RECALL_COOLDOWN_MS = 10_000;

/** Chama de novo uma senha já chamada: o painel da TV anuncia outra vez. */
export async function recallTicket(formData: FormData) {
  const loaded = await loadForAction(formData);
  if (!loaded || !CALLED_STAGES.includes(loaded.ticket.stage)) return;
  const { ticket } = loaded;

  // Freio contra clique repetido: no máximo uma chamada a cada 10 segundos.
  const last = await prisma.ticketEvent.findFirst({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < RECALL_COOLDOWN_MS)
    return;

  // O evento repete a etapa; o tempo dela continua contando desde a 1ª chamada.
  await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, stage: ticket.stage, room: ticket.room },
  });

  revalidatePath("/fila");
}

/** Marca que o paciente chamado não compareceu. */
export async function markNoShow(formData: FormData) {
  const loaded = await loadForAction(formData);
  if (!loaded || !CALLED_STAGES.includes(loaded.ticket.stage)) return;
  const { ticket } = loaded;

  const moved = await prisma.ticket.updateMany({
    where: { id: ticket.id, stage: ticket.stage },
    data: { stage: "NO_SHOW", stageEnteredAt: new Date() },
  });
  if (moved.count === 1) {
    await prisma.ticketEvent.create({
      data: { ticketId: ticket.id, stage: "NO_SHOW", room: ticket.room },
    });
  }

  revalidatePath("/fila");
}

/** Recepção: o paciente que não compareceu chegou depois e volta para o fim da fila. */
export async function reinsertTicket(formData: FormData) {
  await requireUser(["RECEPTION"]);

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const moved = await prisma.ticket.updateMany({
    where: { id, stage: "NO_SHOW" },
    data: {
      stage: "WAITING_RECEPTION",
      room: null,
      stageEnteredAt: new Date(),
    },
  });
  if (moved.count === 1) {
    await prisma.ticketEvent.create({
      data: { ticketId: id, stage: "WAITING_RECEPTION" },
    });
  }

  revalidatePath("/fila");
}
