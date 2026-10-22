import { startOfToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { CALLED_STAGES } from "@/lib/flow";
import { NextResponse } from "next/server";

/**
 * Últimas chamadas do dia, da mais recente para a mais antiga.
 * Vem do histórico (TicketEvent), então uma senha continua no painel
 * mesmo depois que o paciente avançou de etapa.
 */
export async function GET() {
  const events = await prisma.ticketEvent.findMany({
    where: {
      stage: { in: CALLED_STAGES },
      createdAt: { gte: startOfToday() },
    },
    orderBy: { createdAt: "desc" },
    take: 7,
    select: {
      id: true,
      room: true,
      createdAt: true,
      ticket: { select: { code: true, type: true } },
    },
  });

  return NextResponse.json({
    calls: events.map((e) => ({
      id: e.id,
      code: e.ticket.code,
      type: e.ticket.type,
      room: e.room,
      at: e.createdAt.toISOString(),
    })),
  });
}
