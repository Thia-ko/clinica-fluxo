import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold">Entrar</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Acesso da equipe da clínica. Seu cargo é definido pelo RH/T.I.
      </p>
      <LoginForm />
    </main>
  );
}
