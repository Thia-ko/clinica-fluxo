"use client";

import { useActionState } from "react";
import {
  ALL_REASONS,
  COMMENT_MAX,
  RATING_LABEL,
  REASON_LABEL,
} from "@/lib/feedback";
import { submitFeedback, type FeedbackState } from "../actions";

export default function FeedbackForm({
  token,
  code,
}: {
  token: string;
  code: string;
}) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(
    submitFeedback,
    {},
  );

  if (state.done) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold">Obrigado!</h1>
        <p className="mt-3 text-lg text-zinc-600">
          Sua opinião ajuda a clínica a melhorar o atendimento.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="token" value={token} />

      <div>
        <h1 className="text-2xl font-bold">Como foi seu atendimento?</h1>
        <p className="mt-1 text-sm text-zinc-600">Senha {code}</p>
      </div>

      <fieldset>
        <legend className="mb-3 font-medium">Sua nota</legend>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                required
                className="peer sr-only"
              />
              <span className="flex h-16 flex-col items-center justify-center rounded-xl border-2 border-zinc-200 text-xl font-bold peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-blue-600">
                {n}
                <span className="text-[10px] font-normal text-zinc-500">
                  {RATING_LABEL[n]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-medium">O que mais incomodou?</legend>
        <p className="mb-3 text-sm text-zinc-600">
          Marque quantos quiser (ou nenhum).
        </p>
        <div className="space-y-2">
          {ALL_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3 has-checked:border-blue-600 has-checked:bg-blue-50"
            >
              <input
                type="checkbox"
                name="reasons"
                value={reason}
                className="h-5 w-5"
              />
              {REASON_LABEL[reason]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="font-medium">Quer contar mais? (opcional)</span>
        <textarea
          name="comment"
          rows={4}
          maxLength={COMMENT_MAX}
          className="mt-2 w-full rounded-xl border border-zinc-300 p-3"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Não escreva dados pessoais, como nome, CPF ou telefone.
        </span>
      </label>

      {state.error && (
        <p role="alert" className="text-red-600">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
