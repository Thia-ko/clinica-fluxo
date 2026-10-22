import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador (T.I./RH)",
  RECEPTION: "Recepção",
  NURSE: "Enfermagem",
  DOCTOR: "Médico(a)",
  MANAGER: "Gestor(a)",
};

export const ALL_ROLES = Object.keys(ROLE_LABEL) as Role[];

/** Para onde cada cargo vai logo depois de entrar. */
export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin/usuarios" : "/fila";
}
