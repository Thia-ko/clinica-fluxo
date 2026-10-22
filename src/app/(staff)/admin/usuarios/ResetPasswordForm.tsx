"use client";

import { useActionState, useState } from "react";
import { resetUserPassword, type ResetPasswordState } from "./actions";
import TempPasswordNotice from "./TempPasswordNotice";

export default function ResetPasswordForm({
  userId,
  userName,
}: {
  userId: number;
  userName: string;
}) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetUserPassword,
    {},
  );
  // Confirmação na própria tela (em vez da janela do navegador).
  const [confirming, setConfirming] = useState(false);

  return (
    <form
      // Fecha o painel de confirmação só depois que o envio começou.
      action={(formData) => {
        setConfirming(false);
        action(formData);
      }}
      className="mt-2"
    >
      <input type="hidden" name="id" value={userId} />

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs text-blue-700 hover:underline"
        >
          Redefinir senha
        </button>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs">
          <p>
            Redefinir a senha de <strong>{userName}</strong>? As sessões abertas
            dela serão encerradas.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              disabled={pending}
              className="rounded bg-zinc-900 px-2 py-1 font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {pending ? "Redefinindo..." : "Sim, redefinir"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded border border-zinc-300 bg-white px-2 py-1 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {state.error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {state.error}
        </p>
      )}
      {state.tempPassword && (
        <div className="mt-2">
          <TempPasswordNotice password={state.tempPassword} who={userName} />
        </div>
      )}
    </form>
  );
}
