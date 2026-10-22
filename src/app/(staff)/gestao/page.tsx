import Link from "next/link";
import { Suspense } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import { requireUser } from "@/lib/auth";
import {
  loadDashboard,
  parsePeriod,
  PERIODS,
  type PeriodKey,
} from "@/lib/dashboard";
import { STAGE_LABEL } from "@/lib/flow";
import { fmtMin } from "./format";
import HourColumns from "./HourColumns";
import StageBars from "./StageBars";

export default function GestaoPage({ searchParams }: PageProps<"/gestao">) {
  return (
    <main className="viz mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AutoRefresh seconds={15} />
      <h1 className="text-3xl font-bold">Gestão do fluxo</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Onde o paciente espera mais e quando. Atualiza sozinho a cada 15
        segundos.
      </p>

      <Suspense fallback={<p className="mt-8 text-zinc-500">Carregando...</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Dashboard({
  searchParams,
}: {
  searchParams: PageProps<"/gestao">["searchParams"];
}) {
  await requireUser(["MANAGER"]);
  const period = parsePeriod((await searchParams).periodo);
  const { summary, alerts, inQueue } = await loadDashboard(period);

  return (
    <>
      <PeriodFilter current={period} />

      {/* Alertas ao vivo: independem do período escolhido. */}
      <section
        aria-labelledby="alertas"
        className="mt-6 rounded-xl border border-zinc-200 p-5"
      >
        <h2 id="alertas" className="font-semibold">
          Alertas agora
        </h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-sm">
            <span style={{ color: "var(--viz-good)" }}>✓</span> Nenhuma senha
            acima do limite de espera.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm">
              <span style={{ color: "var(--viz-critical)" }}>▲</span>{" "}
              {alerts.length} senha(s) esperando além do limite:
            </p>
            <ul className="mt-3 divide-y divide-zinc-100 text-sm">
              {alerts.map((a) => (
                <li
                  key={a.code}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2"
                >
                  <span>
                    <strong>{a.code}</strong>
                    {a.type === "PRIORITY" && (
                      <span className="ml-2 text-xs text-amber-700">
                        prioritária
                      </span>
                    )}
                    <span className="ml-2 text-zinc-600">
                      {STAGE_LABEL[a.stage]}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {fmtMin(a.waitedMin)}{" "}
                    <span className="text-zinc-500">
                      (limite {a.limitMin} min)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {summary.issued === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
          Ainda não há senhas em <strong>{PERIODS[period].label}</strong>. Gere
          senhas no totem ou rode <code>npm run seed:demo</code> para ver o
          painel com dados fictícios.
        </p>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 p-5 sm:col-span-2">
              <p className="text-sm text-zinc-600">Espera média por paciente</p>
              <p className="mt-1 text-5xl font-bold tracking-tight">
                {summary.avgWaitMin === null ? "—" : fmtMin(summary.avgWaitMin)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Soma do tempo parado na recepção, triagem e consulta.
              </p>
            </div>
            <Tile label="Senhas emitidas" value={String(summary.issued)} />
            <Tile
              label="Atendimentos finalizados"
              value={String(summary.finished)}
            />
            <Tile
              label="Tempo médio na clínica"
              value={
                summary.avgTotalMin === null ? "—" : fmtMin(summary.avgTotalMin)
              }
              hint="da chegada ao fim"
            />
            <Tile label="Em andamento agora" value={String(inQueue)} />
          </section>

          <section className="mt-6 rounded-xl border border-zinc-200 p-5">
            <h2 className="font-semibold">Tempo médio por etapa</h2>
            <p className="mb-5 text-sm text-zinc-600">
              Quanto a senha ficou em cada etapa, em{" "}
              {PERIODS[period].label.toLowerCase()}.
            </p>
            <StageBars stages={summary.stages} />
          </section>

          <section className="mt-6 rounded-xl border border-zinc-200 p-5">
            <h2 className="font-semibold">Senhas por horário</h2>
            <p className="mb-5 text-sm text-zinc-600">
              Em que horas a clínica enche (hora da emissão da senha).
            </p>
            <HourColumns byHour={summary.byHour} />
          </section>
        </>
      )}
    </>
  );
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-5">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/** Uma linha de filtro acima de tudo que ela controla. */
function PeriodFilter({ current }: { current: PeriodKey }) {
  return (
    <nav aria-label="Período" className="mt-6 flex flex-wrap gap-2 text-sm">
      {(Object.keys(PERIODS) as PeriodKey[]).map((key) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={`/gestao?periodo=${key}`}
            aria-current={active ? "true" : undefined}
            className={`rounded-lg border px-3 py-1.5 ${
              active
                ? "border-zinc-900 font-semibold"
                : "border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {active && <span aria-hidden>✓ </span>}
            {PERIODS[key].label}
          </Link>
        );
      })}
    </nav>
  );
}
