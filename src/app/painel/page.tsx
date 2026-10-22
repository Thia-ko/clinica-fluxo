import type { Metadata } from "next";
import { Suspense } from "react";
import DeviceGate from "@/components/DeviceGate";
import PainelScreen from "./PainelScreen";

export const metadata: Metadata = { title: "Painel de chamada · ClinicaFluxo" };

// Tela da TV da sala de espera. Autorize o aparelho uma vez em /aparelho e,
// na primeira vez, toque em "Ativar som e voz".
export default function PainelPage() {
  return (
    <Suspense fallback={null}>
      <DeviceGate>
        <PainelScreen />
      </DeviceGate>
    </Suspense>
  );
}
