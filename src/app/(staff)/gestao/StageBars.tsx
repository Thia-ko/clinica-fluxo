import { STAGE_LABEL } from "@/lib/flow";
import type { StageStat } from "@/lib/metrics";
import { fmtMin } from "./format";

/**
 * Barras horizontais: tempo médio em cada etapa.
 * O traço preto marca o limite; barra acima do limite fica vermelha e ganha
 * ícone + texto (nunca só a cor).
 */
export default function StageBars({ stages }: { stages: StageStat[] }) {
  const scaleMax =
    Math.max(...stages.flatMap((s) => [s.avgMin, s.limitMin ?? 0]), 1) * 1.3;

  return (
    <>
      <ul className="space-y-5">
        {stages.map((s) => {
          const over = s.limitMin !== undefined && s.avgMin > s.limitMin;
          const pct = (s.avgMin / scaleMax) * 100;
          const limitPct =
            s.limitMin === undefined ? null : (s.limitMin / scaleMax) * 100;
          const tip = `${STAGE_LABEL[s.stage]}: média ${fmtMin(s.avgMin)}, máximo ${fmtMin(s.maxMin)}, ${s.count} atendimento(s)`;

          return (
            <li
              key={s.stage}
              tabIndex={0}
              title={tip}
              aria-label={tip}
              className="grid grid-cols-[8.5rem_1fr] items-center gap-3 rounded outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <div className="text-sm leading-tight">
                <span className="font-medium">{STAGE_LABEL[s.stage]}</span>
                <span className="block text-xs text-zinc-500">
                  {s.limitMin === undefined
                    ? "sem limite"
                    : `limite ${s.limitMin} min`}
                </span>
                {over && (
                  <span className="mt-0.5 block text-xs font-medium">
                    <span style={{ color: "var(--viz-critical)" }}>▲</span>{" "}
                    acima do limite
                  </span>
                )}
              </div>

              <div className="relative h-6">
                <div
                  className="absolute inset-y-0 left-0 rounded-r-[4px]"
                  style={{
                    width: `${pct}%`,
                    background: over
                      ? "var(--viz-critical)"
                      : "var(--viz-series)",
                  }}
                />
                {limitPct !== null && (
                  <div
                    className="absolute -bottom-1 -top-1 w-0.5 bg-zinc-900"
                    style={{ left: `${limitPct}%` }}
                  />
                )}
                <span
                  className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold"
                  style={{
                    left: `calc(${Math.max(pct, limitPct ?? 0)}% + 10px)`,
                  }}
                >
                  {fmtMin(s.avgMin)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-zinc-500">
        Traço preto = limite da etapa. Passe o mouse (ou use Tab) sobre uma
        barra para ver média, máximo e quantidade.
      </p>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-blue-700">
          Ver como tabela
        </summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-1 pr-3">Etapa</th>
              <th className="py-1 pr-3">Atend.</th>
              <th className="py-1 pr-3">Média</th>
              <th className="py-1 pr-3">Máximo</th>
              <th className="py-1">Acima do limite</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.stage} className="border-t border-zinc-100">
                <td className="py-1 pr-3">{STAGE_LABEL[s.stage]}</td>
                <td className="py-1 pr-3 tabular-nums">{s.count}</td>
                <td className="py-1 pr-3 tabular-nums">{fmtMin(s.avgMin)}</td>
                <td className="py-1 pr-3 tabular-nums">{fmtMin(s.maxMin)}</td>
                <td className="py-1 tabular-nums">
                  {s.overLimitPct === undefined
                    ? "—"
                    : `${Math.round(s.overLimitPct)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
