import type { Metadata } from "next";
import { Suspense } from "react";
import DeviceGate from "@/components/DeviceGate";
import TotemScreen from "./TotemScreen";

export const metadata: Metadata = { title: "Totem · ClinicaFluxo" };

export default function TotemPage() {
  return (
    <Suspense fallback={null}>
      <DeviceGate>
        <main className="flex flex-1 items-center justify-center px-8 py-12">
          <TotemScreen />
        </main>
      </DeviceGate>
    </Suspense>
  );
}
