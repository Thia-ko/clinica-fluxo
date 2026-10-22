import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/roles";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Entrar · ClinicaFluxo" };

const HIGHLIGHTS = [
  "Senhas e fila de atendimento em tempo real",
  "Painel de chamada com som e voz para a sala de espera",
  "Tempos de espera medidos por etapa, com alertas de atraso",
  "Pesquisa de satisfação do paciente por QR code",
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen flex-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Quem já está logado não precisa ver o formulário de novo. */}
      <Suspense fallback={null}>
        <AlreadySignedIn />
      </Suspense>

      <aside className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 to-blue-950 p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Menos espera,
            <br />
            mais cuidado.
          </h2>
          <ul className="mt-8 space-y-3 text-blue-50">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="text-blue-200">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-blue-200">
          Projeto de estudo com dados fictícios.
        </p>
      </aside>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 text-blue-800 lg:hidden" />
          <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Acesso da equipe da clínica. Seu cargo é definido pelo RH/T.I.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

async function AlreadySignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/conta" : homeFor(user.role));
  return null;
}
