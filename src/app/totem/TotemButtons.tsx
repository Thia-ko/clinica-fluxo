"use client";

import { useState, useTransition } from "react";
import { createTicket } from "../actions";

export default function TotemButtons() {
  const [issued, setIssued] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function emit(type: "NORMAL" | "PRIORITY") {
    startTransition(async () => {
      const { code } = await createTicket(type);
      setIssued(code);
      // Volta para a tela inicial depois de alguns segundos.
      setTimeout(() => setIssued(null), 6000);
    });
  }

  if (issued) {
    return (
      <div className="text-center">
        <p className="text-xl text-zinc-600">Sua senha é</p>
        <p className="my-4 text-8xl font-bold text-blue-700">{issued}</p>
        <p className="text-zinc-600">Aguarde ser chamado pelo painel.</p>
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-xl gap-6 sm:grid-cols-2">
      <button
        disabled={pending}
        onClick={() => emit("NORMAL")}
        className="rounded-2xl bg-blue-600 p-10 text-2xl font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        Atendimento
        <span className="block text-base font-normal opacity-80">
          Senha normal
        </span>
      </button>
      <button
        disabled={pending}
        onClick={() => emit("PRIORITY")}
        className="rounded-2xl bg-amber-500 p-10 text-2xl font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
      >
        Prioridade
        <span className="block text-base font-normal opacity-90">
          Idosos, gestantes, PcD
        </span>
      </button>
    </div>
  );
}
