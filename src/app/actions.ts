"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TRANSITIONS, canAdvance } from "@/lib/flow";
import type { Stage, TicketType } from "@prisma/client";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Totem: gera a próxima senha do dia (N001, N002... / P001, P002...). */
export async function createTicket(type: TicketType) {
  const prefix = type === "PRIORITY" ? "P" : "N";

  const ticket = await prisma.$transaction(async (tx) => {
    const countToday = await tx.ticket.count({
      where: { type, createdAt: { gte: startOfToday() } },
    });
    const code = `${prefix}${String(countToday + 1).padStart(3, "0")}`;

    return tx.ticket.create({
      data: {
        code,
        type,
        events: { create: { stage: "WAITING_RECEPTION" } },
      },
    });
  });

  revalidatePath("/fila");
  return { id: ticket.id, code: ticket.code };
}

/** Fila: avança uma senha para a próxima etapa do fluxo. */
export async function advanceTicket(formData: FormData) {
  // Esconder o botão na tela não basta: a ação confere login e cargo sozinha.
  const user = await requireUser();

  const id = Number(formData.get("id"));
  const room = (formData.get("room") as string | null) || null;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return;

  const transition = TRANSITIONS[ticket.stage as Stage];
  if (!transition || !canAdvance(user.role, transition)) {
    redirect("/acesso-negado");
  }

  // Só aceita salas que existem para aquela etapa (nunca confie no formulário).
  const finalRoom =
    transition.rooms && room && transition.rooms.includes(room)
      ? room
      : (transition.rooms?.[0] ?? null);

  // Só avança se a senha ainda está na etapa que a pessoa viu na tela
  // (evita duas pessoas avançarem a mesma senha ao mesmo tempo).
  const moved = await prisma.ticket.updateMany({
    where: { id, stage: ticket.stage },
    data: {
      stage: transition.next,
      room: finalRoom ?? ticket.room,
      stageEnteredAt: new Date(),
    },
  });
  if (moved.count === 1) {
    await prisma.ticketEvent.create({
      data: { ticketId: id, stage: transition.next, room: finalRoom },
    });
  }

  revalidatePath("/fila");
}
