"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ALL_ROLES } from "@/lib/roles";
import type { Role } from "@prisma/client";

export type CreateUserState = {
  error?: string;
  success?: string;
  values?: { name: string; email: string; role: string };
};

function parseRole(value: FormDataEntryValue | null) {
  return ALL_ROLES.find((r) => r === value) as Role | undefined;
}

/** Cria um usuário. Só o ADMIN (RH/T.I.) pode. */
export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireUser(["ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role"));
  const values = { name, email, role: role ?? "" };

  if (!name || !email) return { error: "Informe nome e e-mail.", values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "E-mail inválido.", values };
  }
  if (!role) return { error: "Escolha um cargo.", values };
  if (password.length < 8) {
    return {
      error: "A senha inicial precisa ter ao menos 8 caracteres.",
      values,
    };
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Já existe um usuário com esse e-mail.", values };
  }

  await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
  });

  revalidatePath("/admin/usuarios");
  return { success: `Usuário ${name} criado.` };
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
