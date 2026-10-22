import type { Metadata } from "next";
import PainelScreen from "./PainelScreen";

export const metadata: Metadata = { title: "Painel de chamada · ClinicaFluxo" };

// Tela da TV da sala de espera. Abra esta rota na TV e toque em "Ativar som e voz" uma vez.
export default function PainelPage() {
  return <PainelScreen />;
}
