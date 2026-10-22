import type { Metadata } from "next";
import PairForm from "./PairForm";

export const metadata: Metadata = {
  title: "Autorizar aparelho · ClinicaFluxo",
  robots: { index: false },
};

// Feito uma vez em cada tablet/TV pela T.I. A chave é digitada (e não vai na URL)
// para não ficar em histórico de navegador nem em registro de acesso.
export default function AparelhoPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold">Autorizar aparelho</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Para a T.I.: informe a chave para liberar o totem ou o painel neste
        aparelho.
      </p>
      <PairForm />
    </main>
  );
}
