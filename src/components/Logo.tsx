/** Marca do sistema: um quadrado azul com uma linha de batimento + o nome. */
export default function Logo({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill={light ? "#ffffff" : "#1d4ed8"}
        />
        <path
          d="M5 17h5l3-7 5 13 3-6h6"
          fill="none"
          stroke={light ? "#1d4ed8" : "#ffffff"}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight">ClinicaFluxo</span>
    </span>
  );
}
