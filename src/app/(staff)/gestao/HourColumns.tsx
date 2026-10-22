const PLOT_HEIGHT = 140; // px, só a área das colunas (o eixo fica fora)

/**
 * Colunas: senhas emitidas por hora. É um gráfico de ênfase: a hora de pico
 * leva a cor da série e o resto fica em cinza.
 */
export default function HourColumns({ byHour }: { byHour: number[] }) {
  const used = byHour.flatMap((n, h) => (n > 0 ? [h] : []));
  const first = Math.min(7, ...used);
  const last = Math.max(19, ...used);
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  const max = Math.max(...hours.map((h) => byHour[h]), 1);
  const peakHour = hours.reduce(
    (best, h) => (byHour[h] > byHour[best] ? h : best),
    hours[0],
  );

  return (
    <>
      <div className="relative">
        {/* linha de base (hairline) */}
        <div
          className="absolute inset-x-0 border-t border-zinc-300"
          style={{ top: PLOT_HEIGHT }}
        />
        <ul className="flex items-end gap-1" style={{ height: PLOT_HEIGHT }}>
          {hours.map((h) => {
            const n = byHour[h];
            const isPeak = h === peakHour && n > 0;
            const tip = `${h}h: ${n} senha(s)`;
            return (
              <li
                key={h}
                tabIndex={0}
                title={tip}
                aria-label={tip}
                className="group flex h-full flex-1 flex-col items-center justify-end outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {isPeak && (
                  <span className="mb-1 text-xs font-semibold">{n}</span>
                )}
                <div
                  className="w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80"
                  style={{
                    height:
                      n === 0 ? 0 : Math.max(3, (n / max) * (PLOT_HEIGHT - 20)),
                    background: isPeak
                      ? "var(--viz-series)"
                      : "var(--viz-muted-bar)",
                  }}
                />
              </li>
            );
          })}
        </ul>
        <ul className="mt-1 flex gap-1 text-xs text-zinc-500">
          {hours.map((h) => (
            <li key={h} className="flex-1 text-center">
              {h}h
            </li>
          ))}
        </ul>
      </div>

      {byHour[peakHour] > 0 && (
        <p className="mt-3 text-sm text-zinc-600">
          Horário de pico: <strong>{peakHour}h</strong> ({byHour[peakHour]}{" "}
          senhas).
        </p>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-blue-700">
          Ver como tabela
        </summary>
        <table className="mt-2 text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-1 pr-6">Hora</th>
              <th className="py-1">Senhas</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h} className="border-t border-zinc-100">
                <td className="py-1 pr-6 tabular-nums">{h}h</td>
                <td className="py-1 tabular-nums">{byHour[h]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
