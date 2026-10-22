"use client";

import { useEffect, useRef, useState } from "react";

type Call = {
  id: number;
  code: string;
  type: "NORMAL" | "PRIORITY";
  room: string | null;
  at: string;
};

const POLL_MS = 2500;

/** "P012" → "Senha prioritária 12. Triagem 1." (para a voz do painel) */
function spokenText(c: Call) {
  const kind = c.type === "PRIORITY" ? "prioritária" : "normal";
  return `Senha ${kind} ${Number(c.code.slice(1))}. ${c.room ?? ""}`;
}

/** Dois toques curtos, como o aviso de uma sala de espera. */
function chime(ctx: AudioContext) {
  const start = ctx.currentTime;
  [660, 880].forEach((freq, i) => {
    const t = start + i * 0.28;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PainelScreen() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [offline, setOffline] = useState(false);
  const [flash, setFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [clock, setClock] = useState("--:--");

  // Refs guardam valores que o loop de busca precisa ler sem recriar o loop.
  const audioRef = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(false);
  const lastSeenId = useRef<number | null>(null); // null = ainda não carregou

  function enableSound() {
    // Navegadores só liberam áudio depois de um toque/clique da pessoa.
    audioRef.current = new AudioContext();
    chime(audioRef.current);
    speak("Som ativado.");
    soundOnRef.current = true;
    setSoundOn(true);
  }

  useEffect(() => {
    let failures = 0;

    async function load() {
      try {
        const res = await fetch("/api/painel", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data: { calls: Call[] } = await res.json();
        failures = 0;
        setOffline(false);
        setCalls(data.calls);

        const newest = data.calls[0];
        const newestId = newest?.id ?? 0;

        // Na primeira carga só memorizamos: não anunciamos chamadas antigas.
        if (
          lastSeenId.current !== null &&
          newest &&
          newestId !== lastSeenId.current
        ) {
          setFlash(true);
          setTimeout(() => setFlash(false), 3000);
          if (soundOnRef.current && audioRef.current) {
            chime(audioRef.current);
            setTimeout(() => speak(spokenText(newest)), 900);
          }
        }
        lastSeenId.current = newestId;
      } catch {
        failures += 1;
        if (failures >= 2) setOffline(true);
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const [current, ...previous] = calls;
  const priority = current?.type === "PRIORITY";

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between gap-4 px-10 py-5">
        <span className="text-2xl font-semibold text-zinc-300">
          ClinicaFluxo
        </span>
        <div className="flex items-center gap-5">
          {offline && (
            <span
              role="status"
              className="rounded-full bg-red-900 px-4 py-1 text-sm"
            >
              Reconectando...
            </span>
          )}
          {!soundOn && (
            <button
              onClick={enableSound}
              className="rounded-full border border-zinc-600 px-4 py-1 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              🔈 Ativar som e voz
            </button>
          )}
          <span className="text-4xl font-semibold tabular-nums text-zinc-200">
            {clock}
          </span>
        </div>
      </header>

      <div className="grid flex-1 gap-6 px-10 pb-6 lg:grid-cols-[2fr_1fr]">
        {current ? (
          <section
            aria-live="assertive"
            className={`flex flex-col items-center justify-center rounded-3xl p-8 text-center transition-colors duration-500 ${
              flash
                ? "bg-white text-zinc-950"
                : priority
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-blue-700"
            }`}
          >
            <p className="text-3xl opacity-80">
              {priority ? "Senha prioritária" : "Senha"}
            </p>
            <p className="text-[9rem] font-extrabold leading-none md:text-[14rem]">
              {current.code}
            </p>
            <p className="mt-4 text-5xl font-semibold md:text-6xl">
              {current.room}
            </p>
          </section>
        ) : (
          <section className="flex items-center justify-center rounded-3xl bg-zinc-900 p-8">
            <p className="text-4xl text-zinc-500">
              Aguardando a primeira chamada...
            </p>
          </section>
        )}

        <aside className="rounded-3xl bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold text-zinc-400">
            Últimas chamadas
          </h2>
          <ul className="mt-4 space-y-3">
            {previous.length === 0 && (
              <li className="text-zinc-600">Nenhuma ainda.</li>
            )}
            {previous.map((c) => (
              <li
                key={c.id}
                className="flex items-baseline justify-between gap-3 rounded-xl bg-zinc-800 px-5 py-3"
              >
                <span
                  className={`text-4xl font-bold ${
                    c.type === "PRIORITY" ? "text-amber-400" : "text-white"
                  }`}
                >
                  {c.code}
                </span>
                <span className="text-right text-lg text-zinc-300">
                  {c.room}
                  <span className="block text-sm tabular-nums text-zinc-500">
                    {hhmm(c.at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <footer className="bg-zinc-900 px-10 py-3 text-lg text-zinc-400">
        Atendimento prioritário: idosos (60+), gestantes, lactantes e pessoas
        com deficiência.
      </footer>
    </main>
  );
}
