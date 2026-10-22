"use client";

import { useEffect, useState, useTransition } from "react";
import { createTicket } from "../actions";

type Issued = Awaited<ReturnType<typeof createTicket>>;

const RESET_SECONDS = 20;

function aheadText(ahead: number) {
  if (ahead === 0) return "Você é o próximo a ser atendido.";
  if (ahead === 1) return "Há 1 pessoa na sua frente.";
  return `Há ${ahead} pessoas na sua frente.`;
}

export default function TotemScreen() {
  const [issued, setIssued] = useState<Issued | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESET_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Depois de emitida, a tela volta sozinha ao início para o próximo paciente.
  useEffect(() => {
    if (!issued) return;
    const deadline = Date.now() + RESET_SECONDS * 1000;
    const id = setInterval(() => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) setIssued(null);
      else setSecondsLeft(left);
    }, 500);
    return () => clearInterval(id);
  }, [issued]);

  function emit(type: "NORMAL" | "PRIORITY") {
    setError(null);
    startTransition(async () => {
      try {
        setIssued(await createTicket(type));
        setSecondsLeft(RESET_SECONDS);
      } catch {
        setError("Não foi possível gerar a senha. Procure a recepção.");
      }
    });
  }

  if (issued) {
    const priority = issued.type === "PRIORITY";
    const when = new Date(issued.issuedAt).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });

    return (
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        {/* Esta é a parte que sai na impressão (veja os "print:" abaixo). */}
        <section
          aria-live="polite"
          className="w-full rounded-3xl border-2 border-zinc-200 p-10 print:rounded-none print:border-0 print:p-0"
        >
          <p className="text-2xl font-semibold text-zinc-600 print:text-black">
            ClinicaFluxo
          </p>
          <p className="mt-6 text-xl text-zinc-600 print:text-black">
            Sua senha
          </p>
          <p
            className={`my-2 text-9xl font-extrabold leading-none ${
              priority ? "text-amber-600" : "text-blue-700"
            } print:text-black`}
          >
            {issued.code}
          </p>
          <p className="text-xl font-medium">
            {priority ? "Atendimento prioritário" : "Atendimento normal"}
          </p>
          <p className="mt-6 text-2xl">{aheadText(issued.ahead)}</p>
          <p className="mt-2 text-zinc-500 print:text-black">{when}</p>
          <p className="mt-6 text-lg text-zinc-600 print:text-black">
            Aguarde ser chamado pelo painel.
          </p>
        </section>

        <div className="flex gap-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-2xl border-2 border-zinc-300 px-8 py-4 text-xl font-semibold hover:bg-zinc-50"
          >
            Imprimir senha
          </button>
          <button
            onClick={() => setIssued(null)}
            className="rounded-2xl bg-zinc-900 px-8 py-4 text-xl font-semibold text-white hover:bg-zinc-700"
          >
            Nova senha
          </button>
        </div>
        <p className="text-zinc-500 print:hidden">
          Esta tela volta ao início em {secondsLeft}s.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
      <div>
        <h1 className="text-5xl font-bold tracking-tight">Bem-vindo(a)!</h1>
        <p className="mt-3 text-2xl text-zinc-600">
          Toque em uma opção para retirar sua senha.
        </p>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2">
        <button
          disabled={pending}
          onClick={() => emit("NORMAL")}
          className="min-h-56 rounded-3xl bg-blue-600 p-8 text-4xl font-bold text-white transition active:scale-[0.98] hover:bg-blue-700 disabled:opacity-50"
        >
          Atendimento
          <span className="mt-2 block text-xl font-normal opacity-90">
            Senha normal
          </span>
        </button>
        <button
          disabled={pending}
          onClick={() => emit("PRIORITY")}
          className="min-h-56 rounded-3xl bg-amber-500 p-8 text-4xl font-bold text-zinc-950 transition active:scale-[0.98] hover:bg-amber-400 disabled:opacity-50"
        >
          Prioridade
          <span className="mt-2 block text-xl font-normal">
            Idosos (60+), gestantes, lactantes, pessoas com deficiência
          </span>
        </button>
      </div>

      {pending && <p className="text-xl text-zinc-600">Gerando sua senha...</p>}
      {error && (
        <p role="alert" className="text-xl font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
