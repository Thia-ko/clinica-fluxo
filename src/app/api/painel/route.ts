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
    take: 30,
    select: {
      id: true,
      ticketId: true,
      stage: true,
      room: true,
      createdAt: true,
      ticket: { select: { code: true, type: true } },
    },
  });

  // "Chamar novamente" cria outro evento da mesma etapa: no histórico mostramos
  // só a chamada mais recente de cada senha em cada etapa (triagem e consulta
  // continuam separadas).
  const seen = new Set<string>();
  const unique = events.filter((e) => {
    const key = `${e.ticketId}:${e.stage}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({
    calls: unique.slice(0, 7).map((e) => ({
      id: e.id,
      code: e.ticket.code,
      type: e.ticket.type,
      room: e.room,
      at: e.createdAt.toISOString(),
    })),
  });
}
