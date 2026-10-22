"use client";

import { useState } from "react";

/** Mostra a senha provisória uma única vez, com botão de copiar. */
export default function TempPasswordNotice({
  password,
  who,
}: {
  password: string;
  who?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: a pessoa pode selecionar e copiar à mão.
    }
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p>
        <strong>Senha provisória{who ? ` de ${who}` : ""}:</strong>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-3">
        <code className="select-all rounded bg-white px-3 py-1.5 font-mono text-lg tracking-wider">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-amber-400 bg-white px-3 py-1.5 font-medium hover:bg-amber-100"
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </p>
      <p className="mt-2">
        Anote e passe para a pessoa agora:{" "}
        <strong>ela não será mostrada de novo</strong>. No primeiro acesso o
        sistema pede uma senha nova.
      </p>
    </div>
  );
}
