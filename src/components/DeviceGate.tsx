import Link from "next/link";
import { isDeviceAuthorized, keyIsConfigured } from "@/lib/device";

/** Só mostra o conteúdo (totem/painel) em aparelho autorizado. */
export default async function DeviceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isDeviceAuthorized()) return <>{children}</>;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Aparelho não autorizado</h1>
        <p className="mt-3 text-zinc-600">
          {keyIsConfigured()
            ? "Peça à T.I. para autorizar este aparelho."
            : "A chave de aparelhos (DEVICE_KEY) não está configurada no servidor."}
        </p>
        <Link
          href="/aparelho"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Autorizar este aparelho
        </Link>
      </div>
    </main>
  );
}
