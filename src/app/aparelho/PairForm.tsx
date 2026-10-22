"use client";

import { useActionState } from "react";
import { pairDevice, type PairState } from "./actions";

export default function PairForm() {
  const [state, action, pending] = useActionState<PairState, FormData>(
    pairDevice,
    {},
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Chave de aparelhos
        <input
          name="chave"
          type="password"
          required
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium">
        Este aparelho será
        <select
          name="destino"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          <option value="totem">Totem (paciente retira a senha)</option>
          <option value="painel">Painel da TV (chamadas)</option>
        </select>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Verificando..." : "Autorizar aparelho"}
      </button>
    </form>
  );
}
