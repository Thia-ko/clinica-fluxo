// Usuários FICTÍCIOS para desenvolvimento. Rode com: npm run seed
// Em ambiente real, o primeiro ADMIN deve ser criado de outra forma, com senha forte.
import { PrismaClient, type Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed de demonstração não pode rodar em produção.");
}

// Senha de demonstração (só desenvolvimento). Pode trocar com SEED_PASSWORD=... npm run seed
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "clinica-demo-123";

const DEMO_USERS: { name: string; email: string; role: Role }[] = [
  { name: "Ana Admin", email: "admin@clinica.test", role: "ADMIN" },
  { name: "Rita Recepção", email: "recepcao@clinica.test", role: "RECEPTION" },
  { name: "Enzo Enfermagem", email: "enfermagem@clinica.test", role: "NURSE" },
  { name: "Dra. Marta Médica", email: "medico@clinica.test", role: "DOCTOR" },
  { name: "Gil Gestor", email: "gestor@clinica.test", role: "MANAGER" },
];

const prisma = new PrismaClient();

async function main() {
  for (const u of DEMO_USERS) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, active: true, passwordHash },
      create: { ...u, passwordHash },
    });
  }
  console.log(`✔ ${DEMO_USERS.length} usuários de demonstração prontos.`);
}

main().finally(() => prisma.$disconnect());
