"use client";

import { useEffect, useRef, useState } from "react";

type Called = {
  id: number;
  code: string;
  type: "NORMAL" | "PRIORITY";
  room: string | null;
};

export default function PainelPage() {
  const [called, setCalled] = useState<Called[]>([]);
  const lastTopId = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/painel", { cache: "no-store" });
        const data: { called: Called[] } = await res.json();
        setCalled(data.called);

        // Nova chamada no topo: pisca a tela para chamar a atenção.
        const topId = data.called[0]?.id ?? null;
        if (lastTopId.current !== null && topId !== lastTopId.current) {
          setFlash(true);
          setTimeout(() => setFlash(false), 2500);
        }
        lastTopId.current = topId;
      } catch {
        // Falha de rede momentânea: tenta de novo no próximo ciclo.
      }
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const [current, ...previous] = called;

  return (
    <main className="flex flex-1 flex-col bg-zinc-950 p-8 text-white">
      <h1 className="text-center text-2xl font-semibold text-zinc-400">
        Painel de chamada
      </h1>

      {!current ? (
        <p className="m-auto text-3xl text-zinc-500">
          Aguardando próxima chamada...
        </p>
      ) : (
        <>
          <section
            className={`mx-auto my-8 w-full max-w-3xl rounded-3xl p-10 text-center transition-colors ${
              flash ? "bg-yellow-400 text-zinc-950" : "bg-blue-700"
            }`}
          >
            <p className="text-3xl opacity-80">Senha</p>
            <p className="text-[9rem] font-extrabold leading-none">
              {current.code}
            </p>
            <p className="mt-4 text-5xl font-semibold">{current.room}</p>
          </section>

          <section className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {previous.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-zinc-800 p-4 text-center"
              >
                <p className="text-3xl font-bold">{c.code}</p>
                <p className="text-sm text-zinc-400">{c.room}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
