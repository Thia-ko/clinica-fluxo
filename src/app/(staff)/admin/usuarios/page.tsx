import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALL_ROLES, ROLE_LABEL } from "@/lib/roles";
import { changeUserRole, toggleUserActive } from "./actions";
import CreateUserForm from "./CreateUserForm";
import ResetPasswordForm from "./ResetPasswordForm";

export default function UsuariosPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-bold">Usuários e cargos</h1>
      <p className="mt-1 text-sm text-zinc-600">
        O cargo define o que cada pessoa pode fazer no sistema.
      </p>

      <div className="mt-8">
        <CreateUserForm />
      </div>

      <Suspense
        fallback={<p className="mt-8 text-zinc-500">Carregando usuários...</p>}
      >
        <UserList />
      </Suspense>
    </main>
  );
}

async function UserList() {
  const me = await requireUser(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Cargo</th>
            <th className="px-4 py-3">Situação</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isMe = u.id === me.id;
            return (
              <tr key={u.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium">
                  {u.name}
                  {isMe && (
                    <span className="ml-2 text-xs text-zinc-400">(você)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                <td className="px-4 py-3">
                  {isMe ? (
                    ROLE_LABEL[u.role]
                  ) : (
                    <form action={changeUserRole} className="flex gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded border border-zinc-300 px-2 py-1"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                      <button className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-50">
                        Salvar
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={u.active ? "text-green-700" : "text-zinc-400"}
                  >
                    {u.active ? "Ativo" : "Desativado"}
                  </span>
                  {!isMe && (
                    <form action={toggleUserActive} className="ml-3 inline">
                      <input type="hidden" name="id" value={u.id} />
                      <button className="text-xs text-blue-700 hover:underline">
                        {u.active ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  )}
                  {u.mustChangePassword && (
                    <p className="mt-1 text-xs text-amber-800">
                      ▲ senha provisória: ainda não trocou
                    </p>
                  )}
                  {!isMe && (
                    <ResetPasswordForm userId={u.id} userName={u.name} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
