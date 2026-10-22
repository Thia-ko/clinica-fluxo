import { CLINIC_TZ } from "@/lib/dates";
import { RATING_LABEL, REASON_LABEL } from "@/lib/feedback";
import type { FeedbackSummary } from "@/lib/metrics";
import type { FeedbackReason } from "@prisma/client";
import BarList from "./BarList";

type Comment = {
  rating: number;
  comment: string;
  at: Date;
  reasons: FeedbackReason[];
};

const pt = (n: number, digits = 1) => n.toFixed(digits).replace(".", ",");

export default function FeedbackSection({
  feedback,
  comments,
}: {
  feedback: FeedbackSummary;
  comments: Comment[];
}) {
  return (
    <section className="mt-6 rounded-xl border border-zinc-200 p-5">
      <h2 className="font-semibold">O que o paciente diz</h2>
      <p className="mb-5 text-sm text-zinc-600">
        Pesquisa de satisfação respondida pelo QR code da senha, depois do
        atendimento.
      </p>

      {feedback.count === 0 ? (
        <p className="text-sm text-zinc-600">
          Nenhuma avaliação neste período ainda.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-600">Nota média</p>
              <p className="text-3xl font-semibold">
                {feedback.avg === null ? "—" : pt(feedback.avg)}
                <span className="text-base font-normal text-zinc-500">
                  {" "}
                  / 5
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Avaliações</p>
              <p className="text-3xl font-semibold">{feedback.count}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Responderam</p>
              <p className="text-3xl font-semibold">
                {feedback.responseRate === null
                  ? "—"
                  : `${Math.round(feedback.responseRate)}%`}
              </p>
              <p className="text-xs text-zinc-500">
                dos atendimentos finalizados
              </p>
            </div>
          </div>

          <h3 className="mb-3 mt-8 text-sm font-semibold">
            Distribuição das notas
          </h3>
          <BarList
            items={[5, 4, 3, 2, 1].map((n) => ({
              label: `${n} · ${RATING_LABEL[n]}`,
              value: feedback.distribution[n - 1],
            }))}
          />

          <h3 className="mb-3 mt-8 text-sm font-semibold">
            O que mais incomodou
          </h3>
          <p className="-mt-2 mb-3 text-xs text-zinc-500">
            Número de avaliações que citaram o motivo e a % sobre o total.
          </p>
          {feedback.reasons.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum motivo marcado.</p>
          ) : (
            <BarList
              items={feedback.reasons.map((r) => ({
                label: REASON_LABEL[r.reason],
                value: r.count,
                hint: `${Math.round((r.count / feedback.count) * 100)}%`,
              }))}
            />
          )}

          {comments.length > 0 && (
            <details className="mt-8 text-sm">
              <summary className="cursor-pointer text-blue-700">
                Ver comentários recentes ({comments.length})
              </summary>
              <ul className="mt-3 divide-y divide-zinc-100">
                {comments.map((c, i) => (
                  <li key={i} className="py-3">
                    <p>
                      <strong>Nota {c.rating}</strong>
                      <span className="ml-2 text-xs text-zinc-500">
                        {c.at.toLocaleDateString("pt-BR", {
                          timeZone: CLINIC_TZ,
                        })}
                      </span>
                    </p>
                    {/* Texto livre do paciente: o React escapa, então é seguro exibir. */}
                    <p className="mt-1 whitespace-pre-wrap text-zinc-700">
                      {c.comment}
                    </p>
                    {c.reasons.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {c.reasons.map((r) => REASON_LABEL[r]).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
