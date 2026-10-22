export type BarItem = { label: string; value: number; hint?: string };

/**
 * Barras horizontais simples (uma série só): rótulo à esquerda,
 * valor na ponta da barra. Barra fina, ponta arredondada, base reta.
 */
export default function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = (item.value / (max * 1.25)) * 100;
        const tip = `${item.label}: ${item.value}${item.hint ? ` (${item.hint})` : ""}`;
        return (
          <li
            key={item.label}
            title={tip}
            aria-label={tip}
            tabIndex={0}
            className="grid grid-cols-[10rem_1fr] items-center gap-3 rounded outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:grid-cols-[14rem_1fr]"
          >
            <span className="text-sm leading-tight">{item.label}</span>
            <div className="relative h-5">
              <div
                className="absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{
                  width: `${pct}%`,
                  background: "var(--viz-series)",
                }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold"
                style={{ left: `calc(${pct}% + 10px)` }}
              >
                {item.value}
                {item.hint && (
                  <span className="ml-1 font-normal text-zinc-500">
                    {item.hint}
                  </span>
                )}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
