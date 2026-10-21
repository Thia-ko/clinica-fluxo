import { prisma } from "@/lib/db";
import { CALLED_STAGES } from "@/lib/flow";
import { NextResponse } from "next/server";

/** Senhas atualmente chamadas (em triagem ou consulta), da mais recente para a mais antiga. */
export async function GET() {
  const called = await prisma.ticket.findMany({
    where: { stage: { in: CALLED_STAGES } },
    orderBy: { stageEnteredAt: "desc" },
    take: 8,
    select: {
      id: true,
      code: true,
      type: true,
      room: true,
      stageEnteredAt: true,
    },
  });
  return NextResponse.json({ called });
}
