import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Avalie seu atendimento · ClinicaFluxo",
  robots: { index: false },
};

// Página pública, aberta pelo QR code da senha. Pensada para o celular.
export default function AvaliarPage({ params }: PageProps<"/avaliar/[token]">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <Survey params={params} />
      </Suspense>
    </main>
  );
}

async function Survey({
  params,
}: {
  params: PageProps<"/avaliar/[token]">["params"];
}) {
  const { token } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { feedbackToken: token },
    select: { code: true, stage: true, feedback: { select: { id: true } } },
  });
  if (!ticket) notFound();

  if (ticket.feedback) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold">Obrigado!</h1>
        <p className="mt-3 text-zinc-600">
          A avaliação da senha {ticket.code} já foi enviada.
        </p>
      </div>
    );
  }

  if (ticket.stage !== "DONE") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Quase lá!</h1>
        <p className="mt-3 text-zinc-600">
          A avaliação da senha {ticket.code} abre quando o seu atendimento
          terminar. Volte a este link depois.
        </p>
      </div>
    );
  }

  return <FeedbackForm token={token} code={ticket.code} />;
}
