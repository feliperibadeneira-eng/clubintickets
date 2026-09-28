import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

// Login compartido: organizador y staff usan el mismo formulario, y cada
// uno termina en su propia pantalla según su rol (ver login/actions.ts).
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ORGANIZER" ? "/admin" : "/staff/scan");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Usá tu usuario y contraseña de organizador o de staff.
      </p>
      <LoginForm />
    </main>
  );
}
