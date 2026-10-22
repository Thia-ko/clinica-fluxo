import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Esqueci minha senha · ClinicaFluxo",
};

// Não há redefinição por e-mail: quem controla os acessos é o RH/T.I. da clínica.
export default function EsqueciSenhaPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Logo className="mb-8 text-blue-800" />
      <h1 className="text-3xl font-bold tracking-tight">Esqueci minha senha</h1>
      <p className="mt-3 text-zinc-700">
        Por segurança, as senhas são redefinidas por quem administra os acessos
        da clínica (RH ou T.I.).
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-zinc-700">
        <li>Peça ao administrador para redefinir a sua senha.</li>
        <li>Ele vai te passar uma senha provisória.</li>
        <li>
          Entre com ela: o sistema pede na hora para você criar a sua própria
          senha.
        </li>
      </ol>
      <Link
        href="/login"
        className="mt-8 inline-block text-sm text-blue-700 hover:underline"
      >
        ← Voltar para o login
      </Link>
    </main>
  );
}
