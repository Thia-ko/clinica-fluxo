"use client";

import Link from "next/link";
import { useActionState } from "react";
import PasswordField from "@/components/PasswordField";
import { login, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          // Depois de um erro o e-mail volta preenchido e o cursor vai para a senha.
          autoFocus={!state.email}
          defaultValue={state.email}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <PasswordField
        name="password"
        label="Senha"
        autoComplete="current-password"
        autoFocus={Boolean(state.email)}
      />

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="remember"
          className="mt-0.5 h-4 w-4 rounded border-zinc-300"
        />
        <span>
          Manter conectado por 7 dias
          <span className="block text-xs text-zinc-500">
            Use só no seu aparelho pessoal. Em computador compartilhado, deixe
            desmarcado (a sessão dura um turno de 8 h).
          </span>
        </span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <span aria-hidden>▲</span>
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm">
        <Link href="/esqueci-senha" className="text-blue-700 hover:underline">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
