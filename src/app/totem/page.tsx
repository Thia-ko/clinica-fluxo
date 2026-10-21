import TotemButtons from "./TotemButtons";

export default function TotemPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
      <h1 className="text-3xl font-bold">Retire sua senha</h1>
      <TotemButtons />
    </main>
  );
}
