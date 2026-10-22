import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { logout } from "../login/actions";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-zinc-200" />}>
        <StaffHeader />
      </Suspense>
      {children}
    </>
  );
}

// O cabeçalho lê o login (cookie), por isso fica dentro de um Suspense.
async function StaffHeader() {
  const user = await requireUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="text-base font-bold">
            ClinicaFluxo
          </Link>
          <Link href="/fila" className="hover:text-blue-700">
            Fila
          </Link>
          {(user.role === "ADMIN" || user.role === "MANAGER") && (
            <Link href="/gestao" className="hover:text-blue-700">
              Gestão
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link href="/admin/usuarios" className="hover:text-blue-700">
              Usuários
            </Link>
          )}
        </nav>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span className="text-right leading-tight">
            {user.name}
            <span className="block text-xs text-zinc-500">
              {ROLE_LABEL[user.role]}
            </span>
          </span>
          <button className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
