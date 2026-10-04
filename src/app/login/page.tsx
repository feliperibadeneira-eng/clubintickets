import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

// Login compartido: organizador y staff usan el mismo formulario, y cada
// uno termina en su propia pantalla según su rol (ver login/actions.ts).
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ORGANIZER" ? "/admin" : "/staff/scan");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card className="p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <KeyRound size={20} />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Ingresar</h1>
        <p className="mt-1 text-sm text-muted">
          Usa tu usuario y contraseña de organizador o de staff.
        </p>
        <LoginForm />
      </Card>
    </main>
  );
}
