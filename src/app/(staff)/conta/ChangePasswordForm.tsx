"use client";

import { useActionState } from "react";
import PasswordField from "@/components/PasswordField";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { changePassword, type ChangePasswordState } from "./actions";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, {});

  return (
    <form action={action} className="mt-4 max-w-md space-y-5">
      <PasswordField
        name="current"
        label="Senha atual"
        autoComplete="current-password"
      />
      <PasswordField
        name="next"
        label="Nova senha"
        autoComplete="new-password"
        showStrength
        minLength={MIN_PASSWORD_LENGTH}
        hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Uma frase com várias palavras é uma ótima senha.`}
      />
      <PasswordField
        name="confirm"
        label="Repita a nova senha"
        autoComplete="new-password"
      />

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <span aria-hidden>▲</span>
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900"
        >
          <span aria-hidden>✓</span>
          {state.success}
        </p>
      )}

      <button
        disabled={pending}
        className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
