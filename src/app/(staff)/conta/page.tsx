import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { CLINIC_TZ } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/roles";
import { currentSessionId, listActiveSessions } from "@/lib/session";
import { describeUserAgent } from "@/lib/userAgent";
import { signOutOtherDevices } from "./actions";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Minha conta · ClinicaFluxo" };

const when = (d: Date) =>
  d.toLocaleString("pt-BR", {
    timeZone: CLINIC_TZ,
    dateStyle: "short",
    timeStyle: "short",
  });

export default function ContaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold">Minha conta</h1>
      <Suspense fallback={<p className="mt-6 text-zinc-500">Carregando...</p>}>
        <AccountContent />
      </Suspense>
    </main>
  );
}

async function AccountContent() {
  const user = await requireSession();
  const [sessions, thisSession] = await Promise.all([
    listActiveSessions(user.id),
    currentSessionId(),
  ]);

  return (
    <>
      {user.mustChangePassword && (
        <p
          role="status"
          className="mt-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
        >
          <span aria-hidden>▲</span>
          <span>
            <strong>Defina uma nova senha para continuar.</strong> Você entrou
            com uma senha provisória; escolha uma só sua. Depois disso o sistema
            é liberado.
          </span>
        </p>
      )}

      <section className="mt-6 rounded-xl border border-zinc-200 p-5">
        <h2 className="font-semibold">Seus dados</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Nome</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">E-mail</dt>
            <dd className="break-all font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Cargo</dt>
            <dd className="font-medium">{ROLE_LABEL[user.role]}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-zinc-500">
          Para mudar nome, e-mail ou cargo, fale com o RH/T.I.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 p-5">
        <h2 className="font-semibold">Alterar senha</h2>
        <ChangePasswordForm />
      </section>

      {!user.mustChangePassword && (
        <section className="mt-6 rounded-xl border border-zinc-200 p-5">
          <h2 className="font-semibold">Onde você está conectado</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Se não reconhecer algum aparelho, saia dos outros e troque a sua
            senha.
          </p>

          <ul className="mt-4 divide-y divide-zinc-100">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
              >
                <span className="font-medium">
                  {describeUserAgent(s.userAgent)}
                  {s.id === thisSession && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-900">
                      este aparelho
                    </span>
                  )}
                </span>
                <span className="text-zinc-500">
                  entrou em {when(s.createdAt)} · vale até {when(s.expiresAt)}
                </span>
              </li>
            ))}
          </ul>

          {sessions.length > 1 && (
            <form action={signOutOtherDevices} className="mt-4">
              <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
                Sair dos outros aparelhos
              </button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
