import { PrismaClient } from "@prisma/client";

// Em desenvolvimento o Next recarrega os módulos o tempo todo;
// guardamos o client no `globalThis` para não abrir conexões demais.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
