import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-20 text-center">
      <h1 className="text-3xl font-bold">Acesso negado</h1>
      <p className="mt-3 text-zinc-600">
        Seu cargo não tem permissão para essa ação. Se precisar dela, fale com o
        RH ou a T.I.
      </p>
      <Link
        href="/fila"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Voltar à fila
      </Link>
    </main>
  );
}
