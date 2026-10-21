import { prisma } from "@/lib/db";
import { STAGE_LABEL, TRANSITIONS } from "@/lib/flow";
import type { Stage } from "@prisma/client";
import { connection } from "next/server";
import { Suspense } from "react";
import { advanceTicket } from "../actions";
import AutoRefresh from "./AutoRefresh";

const ACTIVE_STAGES: Stage[] = [
  "WAITING_RECEPTION",
  "WAITING_TRIAGE",
  "IN_TRIAGE",
  "WAITING_CONSULT",
  "IN_CONSULT",
];

function waitingMinutes(since: Date) {
  return Math.floor((Date.now() - since.getTime()) / 60000);
}

export default function FilaPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AutoRefresh />
      <h1 className="text-3xl font-bold">Fila de atendimento</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Atualiza sozinha a cada 5 segundos.
      </p>

      <Suspense
        fallback={<p className="mt-8 text-zinc-500">Carregando fila...</p>}
      >
        <QueueBoard />
      </Suspense>
    </main>
  );
}

// Parte que depende de dados ao vivo: precisa rodar a cada requisição.
async function QueueBoard() {
  await connection();

  const tickets = await prisma.ticket.findMany({
    where: { stage: { in: ACTIVE_STAGES } },
    // Prioritárias primeiro; dentro de cada grupo, quem espera há mais tempo.
    orderBy: [{ type: "desc" }, { stageEnteredAt: "asc" }],
  });

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {ACTIVE_STAGES.map((stage) => {
        const list = tickets.filter((t) => t.stage === stage);
        const transition = TRANSITIONS[stage];
        return (
          <section
            key={stage}
            className="rounded-xl border border-zinc-200 p-4"
          >
            <h2 className="font-semibold">
              {STAGE_LABEL[stage]}{" "}
              <span className="text-sm font-normal text-zinc-500">
                ({list.length})
              </span>
            </h2>
            <ul className="mt-3 space-y-2">
              {list.length === 0 && (
                <li className="text-sm text-zinc-400">Ninguém aqui.</li>
              )}
              {list.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 p-3"
                >
                  <div>
                    <span
                      className={`text-lg font-bold ${t.type === "PRIORITY" ? "text-amber-600" : "text-blue-700"}`}
                    >
                      {t.code}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {waitingMinutes(t.stageEnteredAt)} min
                      {t.room && stage.startsWith("IN_") ? ` · ${t.room}` : ""}
                    </span>
                  </div>
                  {transition && (
                    <form
                      action={advanceTicket}
                      className="flex items-center gap-1"
                    >
                      <input type="hidden" name="id" value={t.id} />
                      {transition.rooms && (
                        <select
                          name="room"
                          className="rounded border border-zinc-300 px-1 py-1 text-xs"
                        >
                          {transition.rooms.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      )}
                      <button className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700">
                        {transition.action}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
