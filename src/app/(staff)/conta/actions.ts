"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getClientIp } from "@/lib/clientIp";
import { prisma } from "@/lib/db";
import { clearFailures, isLocked, registerFailure } from "@/lib/loginLimiter";
import { hashPassword, verifyPassword } from "@/lib/password";
import { validateNewPassword } from "@/lib/passwordPolicy";
import { homeFor } from "@/lib/roles";
import { currentSessionId, revokeOtherSessions } from "@/lib/session";

export type ChangePasswordState = { error?: string; success?: string };

/** A própria pessoa troca a senha. Exige a senha atual (alguém pode ter achado a tela aberta). */
export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await requireSession(); // aceita também quem está com senha provisória

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm)
    return { error: "Preencha todos os campos." };
  if (next !== confirm) {
    return { error: "A confirmação não confere com a nova senha." };
  }
  if (next === current) {
    return { error: "A nova senha precisa ser diferente da atual." };
  }
  const problem = validateNewPassword(next, {
    email: user.email,
    name: user.name,
  });
  if (problem) return { error: problem };

  // Mesmo freio do login: sem isso, uma sessão roubada serviria para adivinhar a senha atual.
  const ip = await getClientIp();
  const limitKey = `senha:${user.id}`;
  if (await isLocked(limitKey, ip)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    await registerFailure(limitKey, ip);
    return { error: "A senha atual está incorreta." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(next),
      mustChangePassword: false,
    },
  });
  await clearFailures(limitKey);
  // Quem tinha a senha antiga (ou uma sessão aberta em outro lugar) perde o acesso.
  await revokeOtherSessions(user.id, await currentSessionId());

  if (user.mustChangePassword) redirect(homeFor(user.role));

  revalidatePath("/conta");
  return {
    success:
      "Senha alterada. As sessões dos outros aparelhos foram encerradas.",
  };
}

/** "Sair dos outros aparelhos": encerra todas as sessões, menos a deste navegador. */
export async function signOutOtherDevices() {
  const user = await requireSession();
  await revokeOtherSessions(user.id, await currentSessionId());
  revalidatePath("/conta");
}
