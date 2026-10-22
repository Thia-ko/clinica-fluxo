import type { Role, Stage, TicketType } from "@prisma/client";

export const STAGE_LABEL: Record<Stage, string> = {
  WAITING_RECEPTION: "Aguardando recepção",
  WAITING_TRIAGE: "Aguardando triagem",
  IN_TRIAGE: "Em triagem",
  WAITING_CONSULT: "Aguardando consulta",
  IN_CONSULT: "Em consulta",
  DONE: "Finalizado",
};

export const TYPE_LABEL: Record<TicketType, string> = {
  NORMAL: "Normal",
  PRIORITY: "Prioritária",
};

/** Salas disponíveis para chamada em cada etapa de atendimento. */
export const ROOMS = {
  triage: ["Triagem 1", "Triagem 2"],
  consult: ["Consultório 1", "Consultório 2", "Consultório 3"],
} as const;

type Transition = {
  next: Stage;
  /** Texto do botão que faz a senha avançar. */
  action: string;
  /** Cargos que podem executar esta ação (o ADMIN pode todas). */
  roles: readonly Role[];
  /** Se a ação é uma chamada, de qual grupo de salas escolher. */
  rooms?: readonly string[];
};

/** Mapa do fluxo: de qual etapa para qual, o que o botão diz e quem pode apertá-lo. */
export const TRANSITIONS: Partial<Record<Stage, Transition>> = {
  WAITING_RECEPTION: {
    next: "WAITING_TRIAGE",
    action: "Fazer check-in",
    roles: ["RECEPTION"],
  },
  WAITING_TRIAGE: {
    next: "IN_TRIAGE",
    action: "Chamar",
    roles: ["NURSE"],
    rooms: ROOMS.triage,
  },
  IN_TRIAGE: {
    next: "WAITING_CONSULT",
    action: "Finalizar triagem",
    roles: ["NURSE"],
  },
  WAITING_CONSULT: {
    next: "IN_CONSULT",
    action: "Chamar",
    roles: ["DOCTOR"],
    rooms: ROOMS.consult,
  },
  IN_CONSULT: {
    next: "DONE",
    action: "Finalizar atendimento",
    roles: ["DOCTOR"],
  },
};

export function canAdvance(role: Role, transition: Transition) {
  return role === "ADMIN" || transition.roles.includes(role);
}

/** Etapas em que a senha aparece no painel da TV (foi chamada). */
export const CALLED_STAGES: Stage[] = ["IN_TRIAGE", "IN_CONSULT"];
