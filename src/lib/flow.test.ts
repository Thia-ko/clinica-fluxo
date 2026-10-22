import { describe, expect, it } from "vitest";
import { ACTIVE_STAGES, TRANSITIONS, canAdvance, stagesForRole } from "./flow";

describe("stagesForRole", () => {
  it("cada cargo de atendimento vê só a sua etapa", () => {
    expect(stagesForRole("RECEPTION")).toEqual(["WAITING_RECEPTION"]);
    expect(stagesForRole("NURSE")).toEqual(["WAITING_TRIAGE", "IN_TRIAGE"]);
    expect(stagesForRole("DOCTOR")).toEqual(["WAITING_CONSULT", "IN_CONSULT"]);
  });

  it("admin e gestor veem tudo", () => {
    expect(stagesForRole("ADMIN")).toEqual(ACTIVE_STAGES);
    expect(stagesForRole("MANAGER")).toEqual(ACTIVE_STAGES);
  });
});

describe("canAdvance", () => {
  it("só o cargo certo avança cada etapa; admin avança todas", () => {
    const checkIn = TRANSITIONS.WAITING_RECEPTION!;
    expect(canAdvance("RECEPTION", checkIn)).toBe(true);
    expect(canAdvance("NURSE", checkIn)).toBe(false);
    expect(canAdvance("MANAGER", checkIn)).toBe(false);
    expect(canAdvance("ADMIN", checkIn)).toBe(true);

    const finishConsult = TRANSITIONS.IN_CONSULT!;
    expect(canAdvance("DOCTOR", finishConsult)).toBe(true);
    expect(canAdvance("RECEPTION", finishConsult)).toBe(false);
  });
});
