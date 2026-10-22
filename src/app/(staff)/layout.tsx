import Link from "next/link";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import { requireSession } from "@/lib/auth";
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
// Usa requireSession (e não requireUser) para também aparecer em /conta quando
// a pessoa ainda está com senha provisória.
async function StaffHeader() {
  const user = await requireSession();
  const pending = user.mustChangePassword;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" aria-label="ClinicaFluxo, página inicial">
            <Logo className="text-blue-800 [&_span]:text-base" />
          </Link>
          {!pending && (
            <>
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
            </>
          )}
        </nav>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <Link
            href="/conta"
            title="Minha conta"
            className="rounded text-right leading-tight hover:text-blue-700"
          >
            {user.name}
            <span className="block text-xs text-zinc-500">
              {ROLE_LABEL[user.role]}
            </span>
          </Link>
          <button className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
