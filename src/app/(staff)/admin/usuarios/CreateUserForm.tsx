"use client";

import { useActionState } from "react";
import { ALL_ROLES, ROLE_LABEL } from "@/lib/roles";
import { createUser, type CreateUserState } from "./actions";
import TempPasswordNotice from "./TempPasswordNotice";

const inputClass = "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2";

export default function CreateUserForm() {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(
    createUser,
    {},
  );

  return (
    <form
      action={action}
      className="grid gap-4 rounded-xl border border-zinc-200 p-5 sm:grid-cols-2"
    >
      <h2 className="font-semibold sm:col-span-2">Novo usuário</h2>
      <label className="text-sm font-medium">
        Nome
        <input
          name="name"
          required
          defaultValue={state.values?.name}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-medium">
        E-mail
        <input
          name="email"
          type="email"
          required
          defaultValue={state.values?.email}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-medium">
        Cargo
        <select
          name="role"
          defaultValue={state.values?.role || "RECEPTION"}
          className={inputClass}
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <p className="self-end text-xs text-zinc-500">
        O sistema gera uma senha provisória. A pessoa troca por uma só dela no
        primeiro acesso.
      </p>

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Criando..." : "Criar usuário"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-green-700">{state.success}</p>
        )}
      </div>

      {state.tempPassword && (
        <div className="sm:col-span-2">
          <TempPasswordNotice password={state.tempPassword} />
        </div>
      )}
    </form>
  );
}
