// Cria (ou atualiza) o PRIMEIRO administrador de um ambiente real.
// Não usa senha fixa: tudo vem de variáveis de ambiente que você define na hora.
//
//   Windows (PowerShell):
//     $env:DATABASE_URL="<url do banco>"; $env:ADMIN_NAME="Seu Nome"
//     $env:ADMIN_EMAIL="voce@exemplo.com"; $env:ADMIN_PASSWORD="<senha forte>"
//     npm run create-admin
//
// Depois de entrar, o admin cria os demais usuários em /admin/usuarios.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("ADMIN_EMAIL não parece um e-mail válido.");
}
if (password.length < 12) {
  throw new Error(
    "Use uma senha de pelo menos 12 caracteres para o administrador.",
  );
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword(password!);
  await prisma.user.upsert({
    where: { email: email! },
    update: { name: name!, role: "ADMIN", active: true, passwordHash },
    create: { name: name!, email: email!, role: "ADMIN", passwordHash },
  });
  console.log(`✔ Administrador ${email} pronto.`);
}

main().finally(() => prisma.$disconnect());
