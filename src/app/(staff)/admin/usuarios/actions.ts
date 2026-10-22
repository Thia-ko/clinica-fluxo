"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ALL_ROLES } from "@/lib/roles";
import { generateTempPassword } from "@/lib/tempPassword";
import type { Role } from "@prisma/client";

export type CreateUserState = {
  error?: string;
  success?: string;
  /** Senha provisória, mostrada uma única vez ao Admin. */
  tempPassword?: string;
  values?: { name: string; email: string; role: string };
};

export type ResetPasswordState = { error?: string; tempPassword?: string };

function parseRole(value: FormDataEntryValue | null) {
  return ALL_ROLES.find((r) => r === value) as Role | undefined;
}

/**
 * Cria um usuário com senha provisória gerada pelo sistema. O Admin nunca
 * escolhe nem conhece a senha definitiva: a pessoa precisa trocá-la ao entrar.
 */
export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireUser(["ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = parseRole(formData.get("role"));
  const values = { name, email, role: role ?? "" };

  if (!name || !email) return { error: "Informe nome e e-mail.", values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "E-mail inválido.", values };
  }
  if (!role) return { error: "Escolha um cargo.", values };
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Já existe um usuário com esse e-mail.", values };
  }

  const tempPassword = generateTempPassword();
  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: `Usuário ${name} criado.`, tempPassword };
}

/** Admin redefine a senha de quem esqueceu: gera uma provisória e derruba as sessões abertas. */
export async function resetUserPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const admin = await requireUser(["ADMIN"]);
  const id = Number(formData.get("id"));

  // A própria senha o Admin troca em "Minha conta" (exige a senha atual).
  if (!Number.isInteger(id) || id === admin.id) {
    return { error: "Use “Minha conta” para trocar a sua própria senha." };
  }
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Usuário não encontrado." };

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
    },
  });
  await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/admin/usuarios");
  return { tempPassword };
}

export async function changeUserRole(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = Number(formData.get("id"));
  const role = parseRole(formData.get("role"));

  // Evita o admin se trancar para fora do sistema sem querer.
  if (!role || id === admin.id) return;

  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/usuarios");
}

export async function toggleUserActive(formData: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = Number(formData.get("id"));
  if (id === admin.id) return;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;

  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  // Desativar também derruba as sessões abertas dessa pessoa.
  if (user.active) await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/admin/usuarios");
}
