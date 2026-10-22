import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

// A raiz não é um menu: cada tela tem a sua própria rota.
//   /totem   → tablet/totem na entrada (paciente)
//   /painel  → TV da sala de espera
//   /login   → equipe (depois do login, cada cargo cai na sua tela)
export default function Home() {
  return (
    <Suspense fallback={null}>
      <Entry />
    </Suspense>
  );
}

async function Entry() {
  const user = await getCurrentUser();
  return redirect(user ? homeFor(user.role) : "/login");
}
