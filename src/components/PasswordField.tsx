"use client";

import { useEffect, useId, useRef, useState } from "react";
import { passwordStrength } from "@/lib/passwordPolicy";

type Props = {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  /** Mostra a barra de força (para criar/trocar senha). */
  showStrength?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  hint?: string;
};

const SEGMENT_COLORS = [
  "bg-red-600",
  "bg-red-600",
  "bg-amber-500",
  "bg-green-600",
  "bg-green-700",
];

/**
 * Campo de senha com:
 *  - botão mostrar/ocultar;
 *  - aviso quando o Caps Lock está ligado (erro comum ao digitar senha);
 *  - (opcional) indicador de força, sempre com texto além da cor.
 */
export default function PasswordField({
  name,
  label,
  autoComplete,
  showStrength = false,
  minLength,
  autoFocus,
  hint,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [value, setValue] = useState("");

  // O React 19 limpa o formulário depois de enviar; zeramos o indicador junto.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setValue("");
      setVisible(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const strength = passwordStrength(value);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onKeyUp={(e) => setCapsOn(e.getModifierState("CapsLock"))}
          onBlur={() => setCapsOn(false)}
          className="w-full rounded-lg border border-zinc-300 py-2 pl-3 pr-20 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {capsOn && (
        <p role="status" className="mt-1 text-sm text-amber-700">
          ⚠ Caps Lock está ligado.
        </p>
      )}

      {hint && !showStrength && (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      )}

      {showStrength && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-1.5 flex-1 rounded-full ${
                  value && strength.score >= n
                    ? SEGMENT_COLORS[strength.score]
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            {value ? `Força: ${strength.label}` : (hint ?? "")}
          </p>
        </div>
      )}
    </div>
  );
}
