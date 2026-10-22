"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { clearFailures, isLocked, registerFailure } from "@/lib/loginLimiter";
import { hashPassword, verifyPassword } from "@/lib/password";
import { homeFor } from "@/lib/roles";
import { createSession, destroySession } from "@/lib/session";

// `email` volta para o formulário: o React 19 limpa os campos depois de cada envio.
export type LoginState = { error?: string; email?: string };

// Hash "de mentira" para gastar o mesmo tempo quando o e-mail não existe,
// assim ninguém descobre quais e-mails estão cadastrados medindo a resposta.
let dummyHash: Promise<string> | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Informe e-mail e senha.", email };
  if (await isLocked(email)) {
    return {
      error: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
      email,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  dummyHash ??= hashPassword("senha-de-mentira");
  const passwordOk = await verifyPassword(
    password,
    user?.passwordHash ?? (await dummyHash),
  );

  if (!user || !user.active || !passwordOk) {
    await registerFailure(email);
    return { error: "E-mail ou senha incorretos.", email };
  }

  await clearFailures(email);
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await createSession(user.id);
  redirect(homeFor(user.role));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
