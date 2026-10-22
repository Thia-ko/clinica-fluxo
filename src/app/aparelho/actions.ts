"use server";

import { redirect } from "next/navigation";
import { authorizeThisDevice, checkDeviceKey } from "@/lib/device";
import { clearFailures, isLocked, registerFailure } from "@/lib/loginLimiter";

export type PairState = { error?: string };

// Reaproveita o freio de tentativas do login, com uma "conta" fixa para o pareamento.
const LIMIT_KEY = "aparelho:pareamento";

export async function pairDevice(
  _prev: PairState,
  formData: FormData,
): Promise<PairState> {
  if (await isLocked(LIMIT_KEY)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const key = String(formData.get("chave") ?? "");
  if (!checkDeviceKey(key)) {
    await registerFailure(LIMIT_KEY);
    return { error: "Chave incorreta." };
  }

  await clearFailures(LIMIT_KEY);
  await authorizeThisDevice();
  redirect(formData.get("destino") === "painel" ? "/painel" : "/totem");
}
