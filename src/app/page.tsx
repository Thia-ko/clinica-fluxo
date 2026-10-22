import Link from "next/link";

const SCREENS = [
  {
    href: "/totem",
    title: "Totem",
    desc: "O paciente tira a senha (normal ou prioritária).",
  },
  {
    href: "/fila",
    title: "Fila de atendimento",
    desc: "Recepção, triagem e consultório avançam as senhas.",
  },
  {
    href: "/painel",
    title: "Painel de chamada",
    desc: "Tela da TV com as senhas chamadas em tempo real.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight">ClinicaFluxo</h1>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Entrar (equipe)
        </Link>
      </div>
      <p className="mt-2 text-lg text-zinc-600">
        Gestão do fluxo de pacientes: da senha ao fim do atendimento.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {SCREENS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-zinc-200 p-5 transition hover:border-blue-500 hover:shadow-sm"
          >
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{s.desc}</p>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-xs text-zinc-500">
        Projeto de estudo com dados fictícios. Não use com dados reais de
        pacientes.
      </p>
    </main>
  );
}
