import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import type { Role, Stage, Ticket } from "@prisma/client";
import {
  advanceTicket,
  markNoShow,
  recallTicket,
  reinsertTicket,
} from "@/app/actions";
import AutoRefresh from "@/components/AutoRefresh";
import { requireUser } from "@/lib/auth";
import { startOfToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  ACTIVE_STAGES,
  STAGE_LABEL,
  TRANSITIONS,
  WAIT_LIMIT_MIN,
  canAdvance,
  stagesForRole,
} from "@/lib/flow";

function minutesSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

export default function FilaPage({ searchParams }: PageProps<"/fila">) {
  return (
    <main className="viz mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AutoRefresh />
      <h1 className="text-3xl font-bold">Fila de atendimento</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Atualiza sozinha a cada 5 segundos. Prioritárias primeiro; depois, quem
        espera há mais tempo.
      </p>

      <Suspense
        fallback={<p className="mt-8 text-zinc-500">Carregando fila...</p>}
      >
        <QueueBoard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Parte que depende de dados ao vivo: precisa rodar a cada requisição.
async function QueueBoard({
  searchParams,
}: {
  searchParams: PageProps<"/fila">["searchParams"];
}) {
  await connection();
  const user = await requireUser();

  const mine = stagesForRole(user.role);
  const hasOwnView = mine.length < ACTIVE_STAGES.length;
  const showAll = !hasOwnView || (await searchParams).ver === "todas";
  const stages = showAll ? ACTIVE_STAGES : mine;

  const [tickets, noShows] = await Promise.all([
    prisma.ticket.findMany({
      where: { stage: { in: stages } },
      // Prioritárias primeiro; dentro de cada grupo, quem espera há mais tempo.
      orderBy: [{ type: "desc" }, { stageEnteredAt: "asc" }],
    }),
    prisma.ticket.findMany({
      where: { stage: "NO_SHOW", stageEnteredAt: { gte: startOfToday() } },
      orderBy: { stageEnteredAt: "desc" },
    }),
  ]);

  const overLimit = tickets.filter((t) => isOverLimit(t)).length;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {hasOwnView ? (
          <nav aria-label="Visão da fila" className="flex gap-2 text-sm">
            <ViewLink href="/fila" active={!showAll}>
              Minha etapa
            </ViewLink>
            <ViewLink href="/fila?ver=todas" active={showAll}>
              Todas as etapas
            </ViewLink>
          </nav>
        ) : (
          <span />
        )}
        <p className="text-sm">
          {overLimit > 0 ? (
            <>
              <span style={{ color: "var(--viz-critical)" }}>▲</span>{" "}
              <strong>{overLimit}</strong> senha(s) acima do limite de espera
            </>
          ) : (
            <>
              <span style={{ color: "var(--viz-good)" }}>✓</span> Nenhuma senha
              acima do limite
            </>
          )}
        </p>
      </div>

      <div
        className={`mt-6 grid gap-6 ${
          stages.length > 1 ? "md:grid-cols-2" : ""
        } ${stages.length > 2 ? "lg:grid-cols-3" : ""}`}
      >
        {stages.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            list={tickets.filter((t) => t.stage === stage)}
            role={user.role}
          />
        ))}
      </div>

      {noShows.length > 0 && (
        <details className="mt-8 rounded-xl border border-zinc-200 p-4">
          <summary className="cursor-pointer font-semibold">
            Não compareceram hoje ({noShows.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {noShows.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 p-3"
              >
                <span>
                  <strong>{t.code}</strong>
                  <span className="ml-2 text-xs text-zinc-500">
                    {t.room} · há {minutesSince(t.stageEnteredAt)} min
                  </span>
                </span>
                {(user.role === "RECEPTION" || user.role === "ADMIN") && (
                  <form action={reinsertTicket}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-white">
                      Reinserir na fila
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Ao reinserir, a senha volta para o fim da fila de recepção.
          </p>
        </details>
      )}
    </>
  );
}

function isOverLimit(t: Pick<Ticket, "stage" | "stageEnteredAt">) {
  const limit = WAIT_LIMIT_MIN[t.stage];
  return limit !== undefined && minutesSince(t.stageEnteredAt) > limit;
}

function ViewLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-lg border px-3 py-1.5 ${
        active
          ? "border-zinc-900 font-semibold"
          : "border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      {active && <span aria-hidden>✓ </span>}
      {children}
    </Link>
  );
}

function StageColumn({
  stage,
  list,
  role,
}: {
  stage: Stage;
  list: Ticket[];
  role: Role;
}) {
  const transition = TRANSITIONS[stage];
  const allowed = transition ? canAdvance(role, transition) : false;
  const isWaiting = stage.startsWith("WAITING_");
  const limit = WAIT_LIMIT_MIN[stage];

  return (
    <section className="rounded-xl border border-zinc-200 p-4">
      <h2 className="font-semibold">
        {STAGE_LABEL[stage]}{" "}
        <span className="text-sm font-normal text-zinc-500">
          ({list.length})
        </span>
      </h2>
      {limit !== undefined && (
        <p className="text-xs text-zinc-500">limite de espera: {limit} min</p>
      )}

      <ul className="mt-3 space-y-2">
        {list.length === 0 && (
          <li className="text-sm text-zinc-400">Ninguém aqui.</li>
        )}
        {list.map((t, index) => {
          const minutes = minutesSince(t.stageEnteredAt);
          const over = limit !== undefined && minutes > limit;
          return (
            <li
              key={t.id}
              className={`rounded-lg p-3 ${
                over ? "bg-red-50 ring-1 ring-red-200" : "bg-zinc-50"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span>
                  <span
                    className={`text-lg font-bold ${
                      t.type === "PRIORITY" ? "text-amber-600" : "text-blue-700"
                    }`}
                  >
                    {t.code}
                  </span>
                  {t.type === "PRIORITY" && (
                    <span className="ml-2 text-xs text-amber-700">
                      prioritária
                    </span>
                  )}
                  {isWaiting && index === 0 && (
                    <span className="ml-2 rounded bg-zinc-900 px-1.5 py-0.5 text-xs font-medium text-white">
                      próxima
                    </span>
                  )}
                </span>
                <span className="text-xs text-zinc-600">
                  {over && (
                    <span style={{ color: "var(--viz-critical)" }}>▲ </span>
                  )}
                  {minutes} min
                  {over && ` (limite ${limit})`}
                  {t.room && !isWaiting ? ` · ${t.room}` : ""}
                </span>
              </div>

              {transition && allowed && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <form
                    action={advanceTicket}
                    className="flex items-center gap-1"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    {transition.rooms && (
                      <select
                        name="room"
                        aria-label="Sala"
                        className="rounded border border-zinc-300 bg-white px-1 py-1 text-xs"
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

                  {!isWaiting && (
                    <details className="text-xs">
                      <summary className="cursor-pointer select-none rounded border border-zinc-300 bg-white px-2 py-1">
                        Mais
                      </summary>
                      <div className="mt-1 flex gap-1">
                        <form action={recallTicket}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="rounded border border-zinc-300 bg-white px-2 py-1 hover:bg-zinc-50">
                            Chamar novamente
                          </button>
                        </form>
                        <form action={markNoShow}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="rounded border border-zinc-300 bg-white px-2 py-1 hover:bg-zinc-50">
                            Não compareceu
                          </button>
                        </form>
                      </div>
                    </details>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
